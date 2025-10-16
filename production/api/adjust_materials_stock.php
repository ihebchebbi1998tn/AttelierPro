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
    $db = new Database();
    $pdo = $db->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $batch_id = $input['batch_id'] ?? null;
        $materials_adjustments = $input['materials_adjustments'] ?? [];
        
        // Validation
        if (!$batch_id) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id is required']);
            exit;
        }
        
        if (empty($materials_adjustments)) {
            http_response_code(400);
            echo json_encode(['error' => 'materials_adjustments is required']);
            exit;
        }
        
        // Get batch info
        $batchStmt = $pdo->prepare("SELECT * FROM production_batches WHERE id = ?");
        $batchStmt->execute([$batch_id]);
        $batch = $batchStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$batch) {
            http_response_code(404);
            echo json_encode(['error' => 'Batch not found']);
            exit;
        }
        
        // Begin transaction
        $pdo->beginTransaction();
        
        try {
            $adjustments = [];
            
            foreach ($materials_adjustments as $adjustment) {
                $material_id = $adjustment['material_id'] ?? null;
                $configured_quantity = floatval($adjustment['configured_quantity'] ?? 0);
                $actual_quantity = floatval($adjustment['actual_quantity'] ?? 0);
                
                if (!$material_id || $configured_quantity <= 0) {
                    continue;
                }
                
                // Calculate difference
                // If actual < configured: add back (configured - actual)
                // If actual > configured: deduct more (actual - configured)
                $difference = $configured_quantity - $actual_quantity;
                
                if ($difference == 0) {
                    // No adjustment needed
                    continue;
                }
                
                // Get current stock
                // Use the production_matieres table (consistent with other APIs)
                $stockStmt = $pdo->prepare("SELECT quantite_stock, nom FROM production_matieres WHERE id = ?");
                $stockStmt->execute([$material_id]);
                $material = $stockStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$material) {
                    continue;
                }
                
                $current_stock = floatval($material['quantite_stock']);
                
                if ($difference > 0) {
                    // Add back to stock (used less than configured)
                    $updateStmt = $pdo->prepare("
                        UPDATE production_matieres 
                        SET quantite_stock = quantite_stock + ? 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$difference, $material_id]);
                    
                    // Create stock transaction record
                    $transactionStmt = $pdo->prepare("
                        INSERT INTO production_transactions_stock (
                            material_id, 
                            type_mouvement, 
                            quantite,
                            quantity_type_id,
                            prix_unitaire,
                            cout_total,
                            motif,
                            reference_commande,
                            user_id,
                            date_transaction
                        ) VALUES (?, 'in', ?, 1, 0, 0, ?, ?, 1, NOW())
                    ");
                    
                    $transactionStmt->execute([
                        $material_id,
                        $difference,
                        "Ajustement - Retour stock (Batch #{$batch_id})",
                        $batch_id
                    ]);
                    
                    $adjustments[] = [
                        'material_id' => $material_id,
                        'material_name' => $material['nom'],
                        'adjustment_type' => 'added',
                        'adjustment_quantity' => $difference,
                        'previous_stock' => $current_stock,
                        'new_stock' => $current_stock + $difference
                    ];
                    
                } else {
                    // Deduct more from stock (used more than configured)
                    $amount_to_deduct = abs($difference);
                    
                    // Check if we have enough stock
                    if ($amount_to_deduct > $current_stock) {
                        $pdo->rollBack();
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'error' => "Stock insuffisant pour le matériau {$material['nom']}. Disponible: {$current_stock}, Requis: {$amount_to_deduct}"
                        ]);
                        exit;
                    }
                    
                    $updateStmt = $pdo->prepare("
                        UPDATE production_matieres 
                        SET quantite_stock = quantite_stock - ? 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$amount_to_deduct, $material_id]);
                    
                    // Create stock transaction record
                    $transactionStmt = $pdo->prepare("
                        INSERT INTO production_transactions_stock (
                            material_id, 
                            type_mouvement, 
                            quantite,
                            quantity_type_id,
                            prix_unitaire,
                            cout_total,
                            motif,
                            reference_commande,
                            user_id,
                            date_transaction
                        ) VALUES (?, 'out', ?, 1, 0, 0, ?, ?, 1, NOW())
                    ");
                    
                    $transactionStmt->execute([
                        $material_id,
                        $amount_to_deduct,
                        "Ajustement - Déduction supplémentaire (Batch #{$batch_id})",
                        $batch_id
                    ]);
                    
                    $adjustments[] = [
                        'material_id' => $material_id,
                        'material_name' => $material['nom'],
                        'adjustment_type' => 'deducted',
                        'adjustment_quantity' => $amount_to_deduct,
                        'previous_stock' => $current_stock,
                        'new_stock' => $current_stock - $amount_to_deduct
                    ];
                }
            }
            
            // Commit transaction
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock adjusted successfully',
                'adjustments' => $adjustments
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    error_log("Database error in adjust_materials_stock.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in adjust_materials_stock.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>
