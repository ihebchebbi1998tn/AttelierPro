<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $batch_id = $_GET['batch_id'] ?? null;
        
        if (!$batch_id) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id is required']);
            exit;
        }
        
        // Get all leftovers for a batch with material details
        $stmt = $pdo->prepare("
            SELECT 
                l.*,
                m.nom AS nom_matiere,
                m.reference AS code_matiere,
                m.quantite_stock AS current_stock,
                qt.nom AS quantity_type_name,
                qt.unite AS quantity_unit
            FROM production_batch_leftovers l
            JOIN production_matieres m ON l.material_id = m.id
            LEFT JOIN production_quantity_types qt ON m.quantity_type_id = qt.id
            WHERE l.batch_id = ?
            ORDER BY l.created_at DESC
        ");
        $stmt->execute([$batch_id]);
        $leftovers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($leftovers);
        
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'save';
        
        if ($action === 'save') {
            // Save leftovers for a batch
            $batch_id = $input['batch_id'] ?? null;
            $leftovers = $input['leftovers'] ?? [];
            
            if (!$batch_id || !is_array($leftovers)) {
                http_response_code(400);
                echo json_encode(['error' => 'batch_id and leftovers array are required']);
                exit;
            }
            
            $pdo->beginTransaction();
            
            try {
                // Delete existing leftovers for this batch
                $deleteStmt = $pdo->prepare("DELETE FROM production_batch_leftovers WHERE batch_id = ?");
                $deleteStmt->execute([$batch_id]);
                
                // Insert new leftovers
                $insertStmt = $pdo->prepare("
                    INSERT INTO production_batch_leftovers 
                    (batch_id, material_id, leftover_quantity, is_reusable, notes)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                foreach ($leftovers as $leftover) {
                    $insertStmt->execute([
                        $batch_id,
                        $leftover['material_id'],
                        $leftover['quantity'],
                        $leftover['is_reusable'] ? 1 : 0,
                        $leftover['notes'] ?? null
                    ]);
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Leftovers saved successfully'
                ]);
                
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            
        } elseif ($action === 'readd_to_stock') {
            // Re-add selected leftovers to stock
            $leftover_ids = $input['leftover_ids'] ?? [];
            $user_id = $input['user_id'] ?? 'System';
            
            if (!is_array($leftover_ids) || empty($leftover_ids)) {
                http_response_code(400);
                echo json_encode(['error' => 'leftover_ids array is required']);
                exit;
            }
            
            $pdo->beginTransaction();
            
            try {
                $placeholders = str_repeat('?,', count($leftover_ids) - 1) . '?';
                
                // Get leftovers that are reusable and not already readded
                $stmt = $pdo->prepare("
                    SELECT * FROM production_batch_leftovers 
                    WHERE id IN ($placeholders) 
                    AND is_reusable = 1 
                    AND readded_to_stock = 0
                ");
                $stmt->execute($leftover_ids);
                $leftovers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($leftovers)) {
                    throw new Exception('No valid leftovers to re-add');
                }
                
                // Update material quantities
                $updateMaterialStmt = $pdo->prepare("
                    UPDATE production_matieres 
                    SET quantite_stock = quantite_stock + ? 
                    WHERE id = ?
                ");
                
                // Create stock transactions
                $insertTransactionStmt = $pdo->prepare("
                    INSERT INTO production_stock_transactions 
                    (matiere_id, type_transaction, quantite, commentaire, utilisateur_id)
                    VALUES (?, 'in', ?, ?, ?)
                ");
                
                // Mark leftovers as readded
                $markReaddedStmt = $pdo->prepare("
                    UPDATE production_batch_leftovers 
                    SET readded_to_stock = 1 
                    WHERE id = ?
                ");
                
                foreach ($leftovers as $leftover) {
                    // Update material stock
                    $updateMaterialStmt->execute([
                        $leftover['leftover_quantity'],
                        $leftover['material_id']
                    ]);
                    
                    // Create transaction record
                    $comment = "Retour de surplus du lot #{$leftover['batch_id']}";
                    $insertTransactionStmt->execute([
                        $leftover['material_id'],
                        $leftover['leftover_quantity'],
                        $comment,
                        $user_id
                    ]);
                    
                    // Mark as readded
                    $markReaddedStmt->execute([$leftover['id']]);
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => count($leftovers) . ' matériaux réintégrés au stock',
                    'count' => count($leftovers)
                ]);
                
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
        }
        
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'id is required']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM production_batch_leftovers WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Leftover deleted successfully'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
