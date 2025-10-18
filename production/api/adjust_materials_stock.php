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
        
        // Check if batch exists
        $checkStmt = $pdo->prepare("SELECT id, batch_reference FROM production_batches WHERE id = ?");
        $checkStmt->execute([$batch_id]);
        $batch = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$batch) {
            http_response_code(404);
            echo json_encode(['error' => 'Batch not found']);
            exit;
        }
        
        error_log("Adjusting stock for batch {$batch_id}: " . json_encode($materials_adjustments));
        
        // Begin transaction
        $pdo->beginTransaction();
        
        try {
            $adjustments = [];
            $insufficient_materials = [];
            
            foreach ($materials_adjustments as $adjustment) {
                $material_id = $adjustment['material_id'] ?? null;
                $configured_quantity = floatval($adjustment['configured_quantity'] ?? 0);
                $actual_quantity = floatval($adjustment['actual_quantity'] ?? 0);
                
                if (!$material_id) {
                    continue;
                }
                
                // Calculate the difference
                $difference = $actual_quantity - $configured_quantity;
                
                // Skip if no adjustment needed
                if (abs($difference) < 0.001) {
                    continue;
                }
                
                // Get material details
                $stmt = $pdo->prepare("
                    SELECT m.*, qt.nom as quantity_type_name, qt.unite as quantity_unit
                    FROM production_matieres m
                    LEFT JOIN production_quantity_types qt ON m.quantity_type_id = qt.id
                    WHERE m.id = ?
                ");
                $stmt->execute([$material_id]);
                $material = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$material) {
                    error_log("Material ID {$material_id} not found");
                    continue;
                }
                
                $current_stock = floatval($material['quantite_stock']);
                
                if ($difference > 0) {
                    // Actual > Configured: Need to deduct MORE from stock
                    
                    // Check if there's enough stock
                    if ($current_stock < $difference) {
                        $insufficient_materials[] = [
                            'material_id' => $material_id,
                            'material_name' => $material['nom'],
                            'couleur' => $material['couleur'],
                            'needed' => $difference,
                            'available' => $current_stock,
                            'shortage' => $difference - $current_stock
                        ];
                        continue;
                    }
                    
                    // Deduct the extra amount from stock
                    $updateStmt = $pdo->prepare("
                        UPDATE production_matieres 
                        SET quantite_stock = quantite_stock - ? 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$difference, $material_id]);
                    
                    // Create stock transaction record (OUT)
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
                            notes,
                            user_id,
                            date_transaction
                        ) VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?, 1, NOW())
                    ");
                    
                    $unit_price = floatval($material['prix_unitaire']);
                    $total_cost = $difference * $unit_price;
                    $reason = "Ajustement production - Batch #{$batch['batch_reference']}";
                    $notes = "Quantité réelle supérieure à préconfiguré (+{$difference} {$material['quantity_unit']})";
                    
                    $transactionStmt->execute([
                        $material_id,
                        $difference,
                        $material['quantity_type_id'],
                        $unit_price,
                        $total_cost,
                        $reason,
                        $batch['batch_reference'],
                        $notes
                    ]);
                    
                    $adjustments[] = [
                        'material_id' => $material_id,
                        'material_name' => $material['nom'],
                        'couleur' => $material['couleur'],
                        'configured_quantity' => $configured_quantity,
                        'actual_quantity' => $actual_quantity,
                        'difference' => $difference,
                        'action' => 'deducted',
                        'remaining_stock' => $current_stock - $difference
                    ];
                    
                } else {
                    // Actual < Configured: Need to ADD BACK to stock
                    $add_back = abs($difference);
                    
                    // Add back to stock
                    $updateStmt = $pdo->prepare("
                        UPDATE production_matieres 
                        SET quantite_stock = quantite_stock + ? 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$add_back, $material_id]);
                    
                    // Create stock transaction record (IN)
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
                            notes,
                            user_id,
                            date_transaction
                        ) VALUES (?, 'in', ?, ?, ?, ?, ?, ?, ?, 1, NOW())
                    ");
                    
                    $unit_price = floatval($material['prix_unitaire']);
                    $total_cost = $add_back * $unit_price;
                    $reason = "Ajustement production - Batch #{$batch['batch_reference']}";
                    $notes = "Quantité réelle inférieure à préconfiguré (-{$add_back} {$material['quantity_unit']})";
                    
                    $transactionStmt->execute([
                        $material_id,
                        $add_back,
                        $material['quantity_type_id'],
                        $unit_price,
                        $total_cost,
                        $reason,
                        $batch['batch_reference'],
                        $notes
                    ]);
                    
                    $adjustments[] = [
                        'material_id' => $material_id,
                        'material_name' => $material['nom'],
                        'couleur' => $material['couleur'],
                        'configured_quantity' => $configured_quantity,
                        'actual_quantity' => $actual_quantity,
                        'difference' => $difference,
                        'action' => 'added_back',
                        'remaining_stock' => $current_stock + $add_back
                    ];
                }
            }
            
            // If there are insufficient materials, rollback and return error
            if (!empty($insufficient_materials)) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Stock insuffisant pour certains matériaux',
                    'insufficient_materials' => $insufficient_materials
                ]);
                exit;
            }
            
            // Commit transaction
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock ajusté avec succès',
                'adjustments' => $adjustments,
                'batch_id' => $batch_id
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
