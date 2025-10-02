<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Add production_specifications column to existing table
    $sql = "ALTER TABLE production_ready_products 
            ADD COLUMN production_specifications JSON DEFAULT NULL COMMENT 'Dynamic specifications like {\"Matériau principal\": \"Coton 100%\", \"Nombre de boutons\": \"6\", \"Type de fermeture\": \"Éclair invisible\"}'";
    
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Table production_ready_products updated successfully with production_specifications column'
    ]);
} catch (PDOException $e) {
    // Check if column already exists
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Column production_specifications already exists'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error adding column: ' . $e->getMessage()
        ]);
    }
}
?>
