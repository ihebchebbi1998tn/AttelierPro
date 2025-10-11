<?php
// Execute the database enhancement for production_ready_products table
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting database enhancement for production_ready_products table...\n";
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/enhance_production_ready_products.sql');
    
    // Split SQL statements by semicolon and execute each one
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && !str_starts_with(trim($statement), '--')) {
            try {
                $db->exec($statement);
                echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
            } catch (Exception $e) {
                echo "⚠ Warning: " . $e->getMessage() . "\n";
                echo "Statement: " . substr($statement, 0, 100) . "...\n";
            }
        }
    }
    
    echo "\nDatabase enhancement completed successfully!\n";
    echo "New columns added:\n";
    echo "- production_quantities: JSON data for size-specific production quantities\n";
    echo "- is_in_production: Flag to track if product is currently in production\n";
    echo "- transferred_at: Timestamp when product was transferred to production list\n";
    echo "- status_product: Enhanced enum with new statuses\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>