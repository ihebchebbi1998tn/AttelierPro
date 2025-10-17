<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting migration: fix_absent_column_datatype...\n";
    
    $sql = file_get_contents(__DIR__ . '/fix_absent_column_datatype.sql');
    
    if ($sql === false) {
        throw new Exception("Could not read SQL file");
    }
    
    $db->exec($sql);
    
    echo "Migration completed successfully!\n";
    echo "Fixed absent column from tinyint(1) to decimal(10,2) to support fractional leave days.\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
