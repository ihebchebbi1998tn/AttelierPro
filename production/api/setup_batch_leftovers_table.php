<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/create_batch_leftovers_table.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Execute the SQL
    $pdo->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Batch leftovers table created successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error creating table: ' . $e->getMessage()
    ]);
}
?>
