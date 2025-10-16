<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Fixing pointage unique key...\n";
    
    // Read and execute SQL
    $sql = file_get_contents(__DIR__ . '/fix_pointage_unique_key.sql');
    $db->exec($sql);
    
    echo "✓ Unique key fixed successfully!\n";
    echo "✓ Table now allows multiple rows per employee per month (one per date)\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
