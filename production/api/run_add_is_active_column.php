<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    echo "Starting migration to add is_active column...\n\n";
    
    // Read and execute SQL
    $sql = file_get_contents(__DIR__ . '/add_is_active_column.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    foreach ($statements as $statement) {
        try {
            $conn->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 100) . "...\n";
        } catch (PDOException $e) {
            // Check if error is because column/index already exists
            if (strpos($e->getMessage(), 'Duplicate column name') !== false || 
                strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "⚠ Already exists: " . substr($statement, 0, 100) . "...\n";
            } else {
                throw $e;
            }
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    echo json_encode([
        'success' => true,
        'message' => 'is_active column added successfully'
    ]);
    
} catch (Exception $e) {
    echo "\n❌ Migration failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
