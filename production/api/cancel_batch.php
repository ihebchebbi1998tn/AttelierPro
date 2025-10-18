<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['batch_id'])) {
        throw new Exception('Batch ID is required');
    }

    $batchReference = $input['batch_id']; // Frontend sends batch_reference string
    $cancellationReason = $input['cancellation_reason'] ?? 'No reason provided';
    $cancelledBy = isset($input['cancelled_by']) ? intval($input['cancelled_by']) : null;

    error_log("=== CANCEL BATCH REQUEST ===");
    error_log("Batch Reference: " . $batchReference);
    error_log("Reason: " . $cancellationReason);
    error_log("Cancelled by: " . ($cancelledBy ?? 'null'));

    // Get database connection
    $database = new Database();
    $conn = $database->getConnection();

    // Start transaction
    $conn->beginTransaction();

    // Get batch details using batch_reference
    $batch_query = "
        SELECT pb.*,
               pb.status as batch_status,
               pr.nom_product as nom_produit
        FROM production_batches pb 
        LEFT JOIN production_ready_products pr ON pb.product_id = pr.id
        WHERE pb.batch_reference = ?
    ";
    
    $batch_stmt = $conn->prepare($batch_query);
    $batch_stmt->execute([$batchReference]);
    $batch = $batch_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$batch) {
        throw new Exception('Batch not found');
    }
    
    // Set correct status field
    if (isset($batch['batch_status'])) {
        $batch['status'] = $batch['batch_status'];
    }

    if ($batch['status'] === 'cancelled') {
        throw new Exception('Batch is already cancelled');
    }

    $batchId = intval($batch['id']);
    $productId = intval($batch['product_id']);
    $quantityToProduce = intval($batch['quantity_to_produce']);

    error_log("Batch ID: $batchId | Reference: $batchReference | Product ID: $productId | Quantity: $quantityToProduce");
    error_log("Current Status: " . $batch['status']);

    // Update batch status to cancelled
    $updateSql = "
        UPDATE production_batches 
        SET 
            status = 'cancelled',
            cancelled_at = NOW(),
            cancelled_by = :cancelled_by,
            cancellation_reason = :cancellation_reason
        WHERE id = :batch_id
    ";
    
    $stmt = $conn->prepare($updateSql);
    $stmt->bindParam(':cancelled_by', $cancelledBy, PDO::PARAM_INT);
    $stmt->bindParam(':cancellation_reason', $cancellationReason, PDO::PARAM_STR);
    $stmt->bindParam(':batch_id', $batchId, PDO::PARAM_INT);
    $stmt->execute();
    
    $rowsAffected = $stmt->rowCount();
    error_log("Batch status update executed - Rows affected: $rowsAffected");
    
    // Verify the update worked
    $verifyStmt = $conn->prepare("SELECT status, cancelled_at, cancellation_reason FROM production_batches WHERE id = :batch_id");
    $verifyStmt->bindParam(':batch_id', $batchId, PDO::PARAM_INT);
    $verifyStmt->execute();
    $verifyResult = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    error_log("After update - Status: " . ($verifyResult['status'] ?? 'NULL') . ", Cancelled at: " . ($verifyResult['cancelled_at'] ?? 'NULL'));

    // Get materials - EXACT SAME QUERY AS batch_complete_report.php
    error_log("=== FETCHING MATERIALS ===");
    
    $materials_query = "
        SELECT ppm.*, pm.nom, pm.prix_unitaire, pm.description, pm.couleur,
               qt.nom as quantity_type_name, qt.unite as quantity_unit,
               ppm.commentaire
        FROM production_product_materials ppm
        JOIN production_matieres pm ON ppm.material_id = pm.id
        LEFT JOIN production_quantity_types qt ON ppm.quantity_type_id = qt.id
        WHERE ppm.product_id = ?
    ";
    
    $materials_stmt = $conn->prepare($materials_query);
    $materials_stmt->execute([$productId]);
    $materials = $materials_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Found " . count($materials) . " materials");
    foreach ($materials as $mat) {
        error_log("Material: {$mat['nom']} (ID: {$mat['material_id']}) - Qty needed: {$mat['quantity_needed']}");
    }
    
    $materialsRestored = [];
    $transactionsCreated = [];

    // Restore materials to stock
    error_log("=== RESTORING MATERIALS ===");
    
    foreach ($materials as $material) {
        $materialId = intval($material['material_id']);
        $quantityNeeded = floatval($material['quantity_needed']);
        $quantityTypeId = intval($material['quantity_type_id']);
        $materialName = $material['nom'];
        
        // Formula: quantity_needed * quantity_to_produce
        $quantityToRestore = $quantityNeeded * $quantityToProduce;
        
        error_log("→ {$materialName}: {$quantityNeeded} x {$quantityToProduce} = {$quantityToRestore}");

        if ($quantityToRestore > 0) {
            // Restore stock
            $updateStmt = $conn->prepare("
                UPDATE production_matieres 
                SET quantite_stock = quantite_stock + :quantity 
                WHERE id = :material_id
            ");
            $updateStmt->bindParam(':quantity', $quantityToRestore);
            $updateStmt->bindParam(':material_id', $materialId, PDO::PARAM_INT);
            $updateStmt->execute();
            
            error_log("  ✓ Stock +{$quantityToRestore}");

            // Create transaction
            $transactionStmt = $conn->prepare("
                INSERT INTO production_transactions_stock 
                (material_id, type_mouvement, quantite, quantity_type_id, notes, date_transaction) 
                VALUES (:material_id, 'in', :quantite, :quantity_type_id, :notes, NOW())
            ");
            $notes = "Annulation batch #$batchId ($batchReference)";
            $transactionStmt->bindParam(':material_id', $materialId, PDO::PARAM_INT);
            $transactionStmt->bindParam(':quantite', $quantityToRestore);
            $transactionStmt->bindParam(':quantity_type_id', $quantityTypeId, PDO::PARAM_INT);
            $transactionStmt->bindParam(':notes', $notes);
            $transactionStmt->execute();
            
            $transactionId = $conn->lastInsertId();
            error_log("  ✓ Transaction #{$transactionId}");

            $materialsRestored[] = [
                'material_id' => $materialId,
                'material_name' => $materialName,
                'quantity_restored' => $quantityToRestore,
                'quantity_type_id' => $quantityTypeId
            ];

            $transactionsCreated[] = [
                'transaction_id' => $transactionId,
                'material_id' => $materialId,
                'quantity' => $quantityToRestore
            ];
        }
    }
    
    error_log("=== MATERIAL RESTORATION COMPLETE ===");

    // Commit transaction
    $conn->commit();

    error_log("=== CANCEL BATCH SUCCESS ===");
    error_log("Materials restored: " . count($materialsRestored));
    error_log("Transactions created: " . count($transactionsCreated));

    echo json_encode([
        'success' => true,
        'message' => 'Batch cancelled successfully',
        'batch_id' => $batchId,
        'materials_restored' => $materialsRestored,
        'transactions_created' => $transactionsCreated
    ]);

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollback();
    }
    
    error_log("=== CANCEL BATCH ERROR ===");
    error_log("Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
