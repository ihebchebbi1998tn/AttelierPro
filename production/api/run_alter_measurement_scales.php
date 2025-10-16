<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Add tolerance_data column to existing table
    $sql = "ALTER TABLE product_measurement_scales 
            ADD COLUMN tolerance_data JSON DEFAULT NULL COMMENT 'Object with measurement_type as key and tolerance value as value like {\"BACK width\": 0.5, \"Chest\": 1.0}'";
    
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Table product_measurement_scales updated successfully with tolerance_data column'
    ]);
} catch (PDOException $e) {
    // Check if column already exists
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Column tolerance_data already exists'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error adding column: ' . $e->getMessage()
        ]);
    }
}
?>