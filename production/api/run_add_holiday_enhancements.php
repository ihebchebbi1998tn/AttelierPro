<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting holiday enhancements migration...\n";
    
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/add_holiday_enhancements.sql');
    
    // Execute the SQL
    $db->exec($sql);
    
    echo "✅ Holiday enhancements migration completed successfully!\n";
    echo "Added fields:\n";
    echo "  - date_end: For period-based leaves\n";
    echo "  - start_time: For time-based leaves\n";
    echo "  - end_time: For time-based leaves\n";
    echo "  - is_paid: For paid/unpaid leave status\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
