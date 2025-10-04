<?php
require_once 'config.php';
$database = new Database();
$db = $database->getConnection();

try {
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/add_batch_materials_quantities.sql');
    
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Column materials_quantities added successfully to production_batches table'
    ]);
} catch (PDOException $e) {
    // Check if column already exists
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Column materials_quantities already exists in production_batches'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}
?>
