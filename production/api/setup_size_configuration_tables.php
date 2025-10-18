<?php
// Setup script for size configuration tables
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Setting up size configuration tables...\n";
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/create_size_configuration_tables.sql');
    
    // Split SQL statements by semicolon and execute each one
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && !str_starts_with(trim($statement), '--')) {
            try {
                $db->exec($statement);
                echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
            } catch (Exception $e) {
                // Handle common errors that are expected (like column already exists)
                $errorMessage = $e->getMessage();
                if (strpos($errorMessage, 'Duplicate column name') !== false || 
                    strpos($errorMessage, 'already exists') !== false ||
                    strpos($errorMessage, 'Duplicate key name') !== false) {
                    echo "ℹ Skipped (already exists): " . substr($statement, 0, 50) . "...\n";
                } else {
                    echo "⚠ Warning: " . $errorMessage . "\n";
                    echo "Statement: " . substr($statement, 0, 100) . "...\n";
                }
            }
        }
    }
    
    echo "\nSize configuration tables setup completed successfully!\n";
    echo "Created tables:\n";
    echo "- product_transfer_batches: Track transfer operations\n";
    echo "- product_size_configuration_history: Track size configuration changes\n";
    echo "- Added columns to production_ready_products for better tracking\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>