<?php
require_once 'config.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

try {
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/update_tax_brackets_2025.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { return !empty($stmt) && !preg_match('/^--/', $stmt); }
    );
    
    // Execute each statement
    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            $db->exec($statement);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Tax brackets updated to 2025 values successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
