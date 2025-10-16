<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $sql = file_get_contents(__DIR__ . '/add_employee_additional_fields.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    $conn->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Additional employee fields added successfully'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
