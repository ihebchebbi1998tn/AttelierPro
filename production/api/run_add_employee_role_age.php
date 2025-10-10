<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $sql = file_get_contents(__DIR__ . '/add_employee_role_age.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    $conn->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Role and age columns added successfully'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
