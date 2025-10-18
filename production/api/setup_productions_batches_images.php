<?php
require_once 'config.php';

echo "<h3>Setting up productions_batches_images table</h3>";

$database = new Database();
$db = $database->getConnection();

try {
    // Create the table
    $db->exec("CREATE TABLE IF NOT EXISTS `productions_batches_images` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `batch_id` INT NOT NULL,
        `image_path` VARCHAR(500) NOT NULL,
        `original_filename` VARCHAR(255) NOT NULL,
        `file_size` INT,
        `description` TEXT,
        `uploaded_by` VARCHAR(100),
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_batch_id` (`batch_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    echo "<p>✅ Table productions_batches_images created successfully</p>";
    
    // Create upload directory
    $upload_dir = 'uploads/batch_images/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
        echo "<p>✅ Created upload directory: $upload_dir</p>";
    } else {
        echo "<p>✅ Upload directory already exists: $upload_dir</p>";
    }
    
    // Test the API
    echo "<p>Testing API endpoint...</p>";
    $testBatchId = 23;
    $response = @file_get_contents("https://luccibyey.com.tn/production/api/batch_images.php?batch_id=$testBatchId");
    if ($response !== false) {
        $data = json_decode($response, true);
        echo "<p>✅ API works: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
        echo "<p>Found " . count($data['data']) . " images for batch $testBatchId</p>";
    } else {
        echo "<p>❌ API not accessible</p>";
    }
    
    echo "<h3>✅ Setup complete! You can now upload batch images.</h3>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>