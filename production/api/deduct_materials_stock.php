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
        
        $product_id = $input['product_id'] ?? null;
        $batch_id = $input['batch_id'] ?? null;
        $quantities_to_produce = $input['quantities_to_produce'] ?? [];
        
        // Validation
        if (!$product_id) {
            http_response_code(400);
            echo json_encode(['error' => 'product_id is required']);
            exit;
        }
        
        if (empty($quantities_to_produce)) {
            http_response_code(400);
            echo json_encode(['error' => 'quantities_to_produce is required']);
            exit;
        }
        
        // Calculate total quantity to produce
        $total_quantity = array_sum($quantities_to_produce);
        
        if ($total_quantity <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Total quantity must be greater than 0']);
            exit;
        }
        
        // Fetch configured materials for the product
        $stmt = $pdo->prepare("
            SELECT ppm.*, m.quantite_stock, m.nom as material_name
            FROM production_product_materials ppm
            JOIN production_matieres m ON m.id = ppm.material_id
            WHERE ppm.product_id = ?
        ");
        $stmt->execute([$product_id]);
        $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($materials)) {
            http_response_code(400);
            echo json_encode(['error' => 'No materials configured for this product']);
            exit;
        }
        
        // Group materials by material_id to avoid duplicate transactions
        // and calculate correct quantities based on size-specific or general configuration
        $grouped_materials = [];
        foreach ($materials as $material) {
            $material_id = $material['material_id'];
            $size_specific = $material['size_specific'] ?? null;
            $quantity_needed = floatval($material['quantity_needed']);
            
            if (!isset($grouped_materials[$material_id])) {
                $grouped_materials[$material_id] = [
                    'material_id' => $material_id,
                    'material_name' => $material['material_name'],
                    'quantite_stock' => $material['quantite_stock'],
                    'total_quantity_needed' => 0
                ];
            }
            
            // Calculate quantity based on size-specific configuration
            if ($size_specific && $size_specific !== 'none' && isset($quantities_to_produce[$size_specific])) {
                // Size-specific: multiply by quantity for that specific size
                $grouped_materials[$material_id]['total_quantity_needed'] += $quantity_needed * intval($quantities_to_produce[$size_specific]);
            } else if (!$size_specific || $size_specific === 'none') {
                // General/non-size-specific: multiply by total quantity (only once)
                // Use a flag to ensure we only count general materials once
                if (!isset($grouped_materials[$material_id]['general_counted'])) {
                    $grouped_materials[$material_id]['total_quantity_needed'] += $quantity_needed * $total_quantity;
                    $grouped_materials[$material_id]['general_counted'] = true;
                }
            }
        }
        
        // Begin transaction
        $pdo->beginTransaction();
        
        try {
            $transactions = [];
            $insufficient_materials = [];
            
            foreach ($grouped_materials as $material) {
                $total_needed = $material['total_quantity_needed'];
                $current_stock = floatval($material['quantite_stock']);
                
                // Check if stock is sufficient
                if ($total_needed > $current_stock) {
                    $insufficient_materials[] = [
                        'material_id' => $material['material_id'],
                        'material_name' => $material['material_name'],
                        'needed' => $total_needed,
                        'available' => $current_stock,
                        'shortage' => $total_needed - $current_stock
                    ];
                    continue;
                }
                
                // Deduct from stock
                $updateStmt = $pdo->prepare("
                    UPDATE production_matieres 
                    SET quantite_stock = quantite_stock - ? 
                    WHERE id = ?
                ");
                $updateStmt->execute([$total_needed, $material['material_id']]);
                
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
                
                $reason = $batch_id 
                    ? "Production - Batch #{$batch_id}" 
                    : "Production - Product #{$product_id}";
                
                $transactionStmt->execute([
                    $material['material_id'],
                    $total_needed,
                    $reason,
                    $batch_id ?? $product_id
                ]);
                
                $transactions[] = [
                    'material_id' => $material['material_id'],
                    'material_name' => $material['material_name'],
                    'quantity_deducted' => $total_needed,
                    'remaining_stock' => $current_stock - $total_needed
                ];
            }
            
            // If there are insufficient materials, rollback and return error
            if (!empty($insufficient_materials)) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Insufficient stock for some materials',
                    'insufficient_materials' => $insufficient_materials
                ]);
                exit;
            }
            
            // Commit transaction
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock deducted successfully',
                'transactions' => $transactions,
                'total_quantity_produced' => $total_quantity
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
    error_log("Database error in deduct_materials_stock.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in deduct_materials_stock.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>
