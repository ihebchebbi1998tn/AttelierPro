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
    
    if (!isset($data['productId'])) {
        throw new Exception('Product ID is required');
    }
    
    $productId = (int)$data['productId'];
    
    error_log("Processing product ID: " . $productId);
    
    try {
        // First check if the column exists
        $checkStmt = $pdo->prepare("SHOW COLUMNS FROM production_ready_products LIKE 'is_seen'");
        $checkStmt->execute();
        $columnExists = $checkStmt->fetch();
        
        if (!$columnExists) {
            error_log("Column 'is_seen' does not exist in production_ready_products table");
            throw new Exception('Column is_seen does not exist in table');
        }
        
        error_log("Column 'is_seen' exists, proceeding with update");
        
        $stmt = $pdo->prepare("UPDATE production_ready_products SET is_seen = 1 WHERE id = ?");
        $result = $stmt->execute([$productId]);
        
        error_log("Update query executed, result: " . ($result ? 'true' : 'false'));
        
        $rowsAffected = $stmt->rowCount();
        error_log("Rows affected: " . $rowsAffected);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Product marked as seen successfully',
                'rowsAffected' => $rowsAffected
            ]);
        } else {
            error_log("Failed to update product");
            throw new Exception('Failed to update product');
        }
        
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error in mark_product_as_seen.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>