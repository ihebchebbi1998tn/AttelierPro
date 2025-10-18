<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/add_salary_breakdown_columns.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Execute SQL
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Salary breakdown columns added successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
