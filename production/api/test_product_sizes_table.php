<?php
// Test product sizes table API
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Check if table exists and show structure
    $query = "DESCRIBE product_sizes_config";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->execute();
        $structure = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'message' => 'Table exists',
            'table_structure' => $structure
        ]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'doesn\'t exist') !== false) {
            // Table doesn't exist, create it
            $createTableQuery = "
                CREATE TABLE IF NOT EXISTS product_sizes_config (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    product_id INT NOT NULL,
                    size_type VARCHAR(50) NOT NULL,
                    size_value VARCHAR(20) NOT NULL,
                    is_active TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_product_size (product_id, size_type, size_value),
                    INDEX idx_product_id (product_id),
                    INDEX idx_size_type (size_type),
                    INDEX idx_is_active (is_active)
                )";
            
            $stmt = $db->prepare($createTableQuery);
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'Table created successfully',
                'action' => 'table_created'
            ]);
        } else {
            throw $e;
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>