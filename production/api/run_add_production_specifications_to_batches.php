<?php
require_once 'config.php';
$database = new Database();
$db = $database->getConnection();

try {
    // Add production_specifications column to production_batches table
    $sql = "ALTER TABLE production_batches 
            ADD COLUMN production_specifications JSON DEFAULT NULL COMMENT 'Production specifications transferred from product'";
    
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Table production_batches updated successfully with production_specifications column'
    ]);
} catch (PDOException $e) {
    // Check if column already exists
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Column production_specifications already exists in production_batches'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}
?>
