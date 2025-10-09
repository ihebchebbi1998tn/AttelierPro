<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    $sql = file_get_contents(__DIR__ . '/create_specification_templates_table.sql');
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Specification templates table created successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error creating table: ' . $e->getMessage()
    ]);
}
?>
