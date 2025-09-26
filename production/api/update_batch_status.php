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