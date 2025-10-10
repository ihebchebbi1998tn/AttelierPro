<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Setting up no_size support for soustraitance products...\n";

    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/add_no_size_support.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $db->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
        }
    }

    echo "\n✅ Successfully added no_size support!\n";
    echo "- Added 'no_size' column to production_soustraitance_products table\n";
    echo "- Updated existing products with no sizes to have no_size = 1\n";
    echo "\nYou can now use the no_size option in the frontend!\n";

} catch (Exception $e) {
    echo "\n❌ Error setting up no_size support: " . $e->getMessage() . "\n";
    exit(1);
}
?>