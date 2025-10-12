<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get input data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['batchId'])) {
        throw new Exception('Batch ID is required');
    }
    
    $batchId = (int)$data['batchId'];
    
    error_log("Processing batch ID: " . $batchId);
    
    try {
        // First check if the column exists
        $checkStmt = $pdo->prepare("SHOW COLUMNS FROM production_batches LIKE 'is_seen'");
        $checkStmt->execute();
        $columnExists = $checkStmt->fetch();
        
        if (!$columnExists) {
            error_log("Column 'is_seen' does not exist in production_batches table");
            throw new Exception('Column is_seen does not exist in table');
        }
        
        error_log("Column 'is_seen' exists, proceeding with update");
        
        $stmt = $pdo->prepare("UPDATE production_batches SET is_seen = 1 WHERE id = ?");
        $result = $stmt->execute([$batchId]);
        
        error_log("Update query executed, result: " . ($result ? 'true' : 'false'));
        
        $rowsAffected = $stmt->rowCount();
        error_log("Rows affected: " . $rowsAffected);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Batch marked as seen successfully',
                'rowsAffected' => $rowsAffected
            ]);
        } else {
            error_log("Failed to update batch");
            throw new Exception('Failed to update batch');
        }
        
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error in mark_batch_as_seen.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
