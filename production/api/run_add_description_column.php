<?php
require_once 'config.php';

// Run the SQL to add description column
$database = new Database();
$db = $database->getConnection();

try {
    // Check if description column already exists
    $checkStmt = $db->prepare("SHOW COLUMNS FROM production_images LIKE 'description'");
    $checkStmt->execute();
    $columnExists = $checkStmt->fetch();
    
    if (!$columnExists) {
        // Add description column
        $alterStmt = $db->prepare("ALTER TABLE `production_images` ADD COLUMN `description` TEXT NULL AFTER `upload_date`");
        $alterStmt->execute();
        echo json_encode(['success' => true, 'message' => 'Description column added successfully']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Description column already exists']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>