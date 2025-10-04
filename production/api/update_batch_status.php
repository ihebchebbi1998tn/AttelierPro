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
        
        if (!$input) {
            // Fallback to POST data
            $input = $_POST;
        }
        
        $batch_id = $input['batch_id'] ?? null;
        $new_status = $input['new_status'] ?? null;
        $changed_by = $input['changed_by'] ?? 'Unknown User';
        $comments = $input['comments'] ?? null;
        
        // Validation
        if (!$batch_id || !$new_status) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id and new_status are required']);
            exit;
        }
        
        // Validate status values
        $valid_statuses = ['planifie', 'en_cours', 'termine', 'en_a_collecter', 'en_magasin', 'cancelled'];
        if (!in_array($new_status, $valid_statuses)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status value']);
            exit;
        }
        
        // Get current batch status
        $currentStmt = $pdo->prepare("SELECT status FROM production_batches WHERE id = ?");
        $currentStmt->execute([$batch_id]);
        $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            http_response_code(404);
            echo json_encode(['error' => 'Batch not found']);
            exit;
        }
        
        $old_status = $current['status'];
        
        // Don't update if status is the same
        if ($old_status === $new_status) {
            echo json_encode([
                'success' => true,
                'message' => 'Status is already ' . $new_status,
                'no_change' => true
            ]);
            exit;
        }
        
        // If changing to "en_cours", validate materials quantities are filled and auto-deduct
        if ($new_status === 'en_cours' && $old_status === 'planifie') {
            // Get batch details
            $batchStmt = $pdo->prepare("SELECT product_id, product_type, materials_quantities, sizes_breakdown FROM production_batches WHERE id = ?");
            $batchStmt->execute([$batch_id]);
            $batchData = $batchStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$batchData) {
                http_response_code(404);
                echo json_encode(['error' => 'Batch data not found']);
                exit;
            }
            
            // Get material configuration for this product
            $materials_table = ($batchData['product_type'] === 'soustraitance') ? 'production_soustraitance_product_materials' : 'production_product_materials';
            $materialsStmt = $pdo->prepare("
                SELECT pm.material_id
                FROM {$materials_table} pm
                WHERE pm.product_id = ?
                GROUP BY pm.material_id
            ");
            $materialsStmt->execute([$batchData['product_id']]);
            $requiredMaterials = $materialsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Check if materials_quantities is filled
            $materialsQuantities = [];
            if (!empty($batchData['materials_quantities'])) {
                $materialsQuantities = json_decode($batchData['materials_quantities'], true) ?: [];
            }
            
            // Validate all materials have quantities filled
            $missingQuantities = [];
            foreach ($requiredMaterials as $materialId) {
                if (!isset($materialsQuantities[$materialId]) || $materialsQuantities[$materialId] <= 0) {
                    $missingQuantities[] = $materialId;
                }
            }
            
            if (!empty($missingQuantities)) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Veuillez remplir les quantités pour tous les matériaux avant de passer en cours',
                    'missing_materials' => $missingQuantities
                ]);
                exit;
            }
            
            // Auto-deduct stock using the filled quantities
            $sizesData = [];
            if (!empty($batchData['sizes_breakdown'])) {
                $sizesData = json_decode($batchData['sizes_breakdown'], true) ?: [];
            }
            
            // Call the stock deduction logic
            require_once 'production_stock_deduction.php';
            
            // We'll trigger the deduction via the API endpoint internally
            // For now, we'll allow the status change and let the frontend handle deduction
            // Or we can implement the deduction logic here directly
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            // Update batch status
            $updateStmt = $pdo->prepare("
                UPDATE production_batches 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $updateStmt->execute([$new_status, $batch_id]);
            
            // Log status change
            $historyStmt = $pdo->prepare("
                INSERT INTO batch_status_history 
                (batch_id, old_status, new_status, changed_by, comments, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            
            $historyStmt->execute([
                $batch_id,
                $old_status,
                $new_status,
                $changed_by,
                $comments,
                $ip_address,
                $user_agent
            ]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Batch status updated successfully',
                'old_status' => $old_status,
                'new_status' => $new_status,
                'history_id' => $pdo->lastInsertId()
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
    error_log("Database error in update_batch_status.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in update_batch_status.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>