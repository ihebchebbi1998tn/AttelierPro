<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

// Initialize database connection
$database = new Database();
$pdo = $database->getConnection();

// Debug logging
error_log("Mark seen API called with method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Received input: " . json_encode($input));
    
    if (!isset($input['id'])) {
        error_log("No ID provided in request");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID is required']);
        exit;
    }
    
    $orderId = intval($input['id']);
    error_log("Processing order ID: " . $orderId);
    
    try {
        // First check if the column exists
        $checkStmt = $pdo->prepare("SHOW COLUMNS FROM production_surmesure_commandes LIKE 'is_seen'");
        $checkStmt->execute();
        $columnExists = $checkStmt->fetch();
        
        if (!$columnExists) {
            error_log("Column 'is_seen' does not exist in production_surmesure_commandes table");
            throw new Exception('Column is_seen does not exist in table');
        }
        
        error_log("Column 'is_seen' exists, proceeding with update");
        
        $stmt = $pdo->prepare("UPDATE production_surmesure_commandes SET is_seen = 1 WHERE id = ?");
        $result = $stmt->execute([$orderId]);
        
        error_log("Update query executed, result: " . ($result ? 'true' : 'false'));
        error_log("Rows affected: " . $stmt->rowCount());
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Order marked as seen', 'rows_affected' => $stmt->rowCount()]);
        } else {
            throw new Exception('Failed to update order');
        }
    } catch (Exception $e) {
        error_log("Error marking sur mesure order as seen: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>