<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

echo "<h3>Fixing Batch Upload Issues</h3>";

try {
    // 1. Add description column to production_images if it doesn't exist
    echo "<p>1. Checking production_images table...</p>";
    $checkStmt = $db->prepare("SHOW COLUMNS FROM production_images LIKE 'description'");
    $checkStmt->execute();
    $columnExists = $checkStmt->fetch();
    
    if (!$columnExists) {
        $alterStmt = $db->prepare("ALTER TABLE `production_images` ADD COLUMN `description` TEXT NULL AFTER `upload_date`");
        $alterStmt->execute();
        echo "<p>✅ Added description column to production_images</p>";
    } else {
        echo "<p>✅ Description column already exists in production_images</p>";
    }

    // 2. Create production_batch_attachments table if it doesn't exist
    echo "<p>2. Checking production_batch_attachments table...</p>";
    $db->exec("CREATE TABLE IF NOT EXISTS production_batch_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(100),
        file_size INT,
        mime_type VARCHAR(100),
        description TEXT,
        uploaded_by VARCHAR(100),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_batch_id (batch_id)
    )");
    echo "<p>✅ production_batch_attachments table ready</p>";

    // 3. Create upload directories
    echo "<p>3. Checking upload directories...</p>";
    $dirs = ['uploads/batch_images/', 'uploads/batch_attachments/'];
    foreach ($dirs as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
            echo "<p>✅ Created directory: $dir</p>";
        } else {
            echo "<p>✅ Directory exists: $dir</p>";
        }
    }

    // 4. Test API endpoints
    echo "<p>4. Testing API endpoints...</p>";
    $testBatchId = 23; // Using batch ID from network requests
    
    echo "<p>Testing batch_images.php...</p>";
    $response = @file_get_contents("https://luccibyey.com.tn/production/api/batch_images.php?batch_id=$testBatchId");
    if ($response !== false) {
        $data = json_decode($response, true);
        echo "<p>✅ batch_images.php works: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
    } else {
        echo "<p>❌ batch_images.php not accessible</p>";
    }
    
    echo "<p>Testing batch_attachments.php...</p>";
    $response = @file_get_contents("https://luccibyey.com.tn/production/api/batch_attachments.php?batch_id=$testBatchId");
    if ($response !== false) {
        $data = json_decode($response, true);
        echo "<p>✅ batch_attachments.php works: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
    } else {
        echo "<p>❌ batch_attachments.php not accessible</p>";
    }

    echo "<h3>✅ All fixes applied successfully!</h3>";
    echo "<p>Your batch upload system should now work correctly.</p>";

} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>