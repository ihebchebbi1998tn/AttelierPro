<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting materiere_type support setup...\n";
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/add_materiere_type_support.sql');
    
    // Split SQL commands by semicolon
    $commands = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($commands as $command) {
        if (!empty($command) && !preg_match('/^--/', $command)) {
            try {
                $db->exec($command);
                echo "✓ Executed: " . substr($command, 0, 50) . "...\n";
            } catch (PDOException $e) {
                // Some commands might fail if columns already exist
                echo "⚠ Warning: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "✅ Materiere type support setup completed!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>