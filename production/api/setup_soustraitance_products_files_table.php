<?php
require_once 'config.php';

echo "<h3>Setting up production_soustraitance_products_files table</h3>";

$database = new Database();
$db = $database->getConnection();

try {
    // Create the table
    $db->exec("CREATE TABLE IF NOT EXISTS `production_soustraitance_products_files` (
        `file_id` INT AUTO_INCREMENT PRIMARY KEY,
        `product_id` INT NOT NULL,
        `file_path` VARCHAR(500) NOT NULL,
        `original_filename` VARCHAR(255) NOT NULL,
        `filename` VARCHAR(255) NOT NULL,
        `file_type` VARCHAR(100),
        `file_size` INT,
        `mime_type` VARCHAR(100),
        `uploaded_user` VARCHAR(100),
        `upload_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `description` TEXT,
        INDEX `idx_product_id` (`product_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    echo "<p>✅ Table production_soustraitance_products_files created successfully</p>";
    
    // Create upload directory
    $upload_dir = 'uploads/soustraitance_product_files/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
        echo "<p>✅ Created upload directory: $upload_dir</p>";
    } else {
        echo "<p>✅ Upload directory already exists: $upload_dir</p>";
    }
    
    // Test the API
    echo "<p>Testing API endpoint...</p>";
    $testProductId = 1;
    $response = @file_get_contents("https://luccibyey.com.tn/production/api/soustraitance_product_files.php?product_id=$testProductId");
    if ($response !== false) {
        $data = json_decode($response, true);
        echo "<p>✅ API works: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
        echo "<p>Found " . count($data['data']) . " files for product $testProductId</p>";
    } else {
        echo "<p>❌ API not accessible</p>";
    }
    
    echo "<h3>✅ Setup complete! You can now upload soustraitance product files.</h3>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>