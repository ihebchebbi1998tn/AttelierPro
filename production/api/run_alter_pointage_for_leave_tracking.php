<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting migration: alter_pointage_for_leave_tracking...\n";
    
    $sql = file_get_contents(__DIR__ . '/alter_pointage_for_leave_tracking.sql');
    
    if ($sql === false) {
        throw new Exception("Could not read SQL file");
    }
    
    $db->exec($sql);
    
    echo "Migration completed successfully!\n";
    echo "Added leave tracking columns to production_employe_pointage table.\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
