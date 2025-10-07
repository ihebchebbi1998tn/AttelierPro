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
        $sizes_breakdown = $input['sizes_breakdown'] ?? null;
        
        // Validation
        if (!$batch_id) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id is required']);
            exit;
        }
        
        if (!$sizes_breakdown || !is_array($sizes_breakdown)) {
            http_response_code(400);
            echo json_encode(['error' => 'sizes_breakdown must be an object with size quantities']);
            exit;
        }
        
        // Calculate total from sizes
        $total_quantity = array_sum(array_map('intval', $sizes_breakdown));
        
        if ($total_quantity < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Total quantity must be at least 1']);
            exit;
        }
        
        // Check if batch exists
        $checkStmt = $pdo->prepare("SELECT id, status, quantity_to_produce FROM production_batches WHERE id = ?");
        $checkStmt->execute([$batch_id]);
        $batch = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$batch) {
            http_response_code(404);
            echo json_encode(['error' => 'Batch not found']);
            exit;
        }
        
        // Allow updates only if batch is not completed or cancelled
        if ($batch['status'] === 'termine' || $batch['status'] === 'annule') {
            http_response_code(400);
            echo json_encode([
                'error' => 'Cannot update quantity for completed or cancelled batches',
                'current_status' => $batch['status']
            ]);
            exit;
        }
        
        $sizes_json = json_encode($sizes_breakdown);
        
        error_log("Updating quantity for batch {$batch_id}: {$batch['quantity_to_produce']} -> {$total_quantity}");
        
        // Update batch quantity and sizes breakdown
        $updateStmt = $pdo->prepare("
            UPDATE production_batches 
            SET quantity_to_produce = ?, sizes_breakdown = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $updateStmt->execute([$total_quantity, $sizes_json, $batch_id]);
        
        error_log("Successfully updated quantity for batch {$batch_id}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Quantity updated successfully',
            'batch_id' => $batch_id,
            'old_quantity' => $batch['quantity_to_produce'],
            'new_quantity' => $total_quantity,
            'sizes_breakdown' => $sizes_breakdown,
            'rows_affected' => $updateStmt->rowCount()
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    error_log("Database error in update_batch_quantity.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in update_batch_quantity.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>
