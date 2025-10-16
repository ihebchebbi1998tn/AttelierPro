<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/create_batch_status_history_table.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $results = [];
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                $results[] = "✓ Executed: " . substr($statement, 0, 50) . "...";
            } catch (PDOException $e) {
                $results[] = "✗ Error: " . $e->getMessage() . " for: " . substr($statement, 0, 50) . "...";
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Batch status history table setup completed',
        'details' => $results
    ]);
    
} catch (Exception $e) {
    error_log("Error in setup_batch_status_history.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>