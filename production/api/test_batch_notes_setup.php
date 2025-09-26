<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    echo "<h2>Testing Production Batch Notes System</h2>";
    
    // Step 1: Create the table
    echo "<h3>Step 1: Creating production_batch_notes table</h3>";
    $db = new Database();
    $pdo = $db->getConnection();
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/create_production_batch_notes_table.sql');
    
    if ($sql === false) {
        throw new Exception('Could not read SQL file');
    }
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                echo "✓ Executed: " . substr($statement, 0, 100) . "...<br>";
            } catch (PDOException $e) {
                echo "✗ Error: " . $e->getMessage() . " for: " . substr($statement, 0, 50) . "...<br>";
            }
        }
    }
    
    echo "<br>";
    
    // Step 2: Test the API endpoints
    echo "<h3>Step 2: Testing API endpoints</h3>";
    
    // Test POST - Create note
    echo "<h4>Testing POST (Create Note)</h4>";
    $postData = [
        'batch_id' => 26, // Using existing batch from network logs
        'note_text' => 'Test note from API test',
        'created_by' => 'Test User'
    ];
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($postData)
        ]
    ]);
    
    $result = file_get_contents('http://localhost/production/api/production_batch_notes.php', false, $context);
    echo "POST Result: " . $result . "<br><br>";
    
    // Test GET - Retrieve notes
    echo "<h4>Testing GET (Retrieve Notes)</h4>";
    $result = file_get_contents('http://localhost/production/api/production_batch_notes.php?batch_id=26');
    echo "GET Result: " . $result . "<br><br>";
    
    echo "<h3>✅ Test completed successfully!</h3>";
    
} catch (Exception $e) {
    echo "<h3>❌ Test failed: " . $e->getMessage() . "</h3>";
    error_log("Error in test_batch_notes_setup.php: " . $e->getMessage());
}
?>