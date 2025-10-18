<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    echo "Starting migration to add is_seen column to production_batches...\n\n";
    
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/add_batch_is_seen_column.sql');
    
    if (!$sql) {
        throw new Exception('Could not read SQL file');
    }
    
    // Split by semicolon to execute each statement separately
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { return !empty($stmt) && strpos($stmt, '--') !== 0; }
    );
    
    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 100) . "...\n";
        } catch (PDOException $e) {
            // Check if column already exists
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "⚠ Column 'is_seen' already exists, skipping...\n";
            } 
            // Check if index already exists
            else if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "⚠ Index already exists, skipping...\n";
            }
            else {
                throw $e;
            }
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    echo "\nThe is_seen functionality is now available for production batches.\n";
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed successfully'
    ]);
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
