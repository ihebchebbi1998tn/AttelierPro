<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/create_salary_config_table.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { return !empty($stmt); }
    );
    
    // Execute each statement
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $db->exec($statement);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Salary configuration tables created and initialized successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
