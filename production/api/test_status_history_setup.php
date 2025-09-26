<?php
// Quick test script to setup and test the batch status history system
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

echo "<h1>Setting up Batch Status History System</h1>";

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    echo "<h2>Step 1: Creating batch_status_history table</h2>";
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/create_batch_status_history_table.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                echo "✓ Executed: " . substr($statement, 0, 50) . "...<br>";
            } catch (PDOException $e) {
                echo "✗ Error: " . $e->getMessage() . " for: " . substr($statement, 0, 50) . "...<br>";
            }
        }
    }
    
    echo "<h2>Step 2: Testing Status Update API</h2>";
    
    // Test status update
    $testBatchId = 26; // Use the current batch ID
    $response = file_get_contents('http://localhost/production/api/update_batch_status.php', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode([
                'batch_id' => $testBatchId,
                'new_status' => 'en_cours',
                'changed_by' => 'Test User',
                'comments' => 'Test status change from setup script'
            ])
        ]
    ]));
    
    echo "Update API Response: " . $response . "<br>";
    
    echo "<h2>Step 3: Testing Status History API</h2>";
    
    // Test history retrieval
    $historyResponse = file_get_contents("http://localhost/production/api/batch_status_history.php?batch_id=$testBatchId");
    echo "History API Response: " . $historyResponse . "<br>";
    
    echo "<h2>Setup Complete!</h2>";
    echo "<p>You can now:</p>";
    echo "<ul>";
    echo "<li>View batch chronology in the Timeline tab</li>";
    echo "<li>Status changes will be automatically logged</li>";
    echo "<li>Access APIs at: update_batch_status.php and batch_status_history.php</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>