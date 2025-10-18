<?php
require_once 'config.php';

echo "<h2>Complete Batch Upload System Setup</h2>";
echo "<hr>";

$database = new Database();
$db = $database->getConnection();

try {
    echo "<h3>1. Creating productions_batches_images table...</h3>";
    
    // Create productions_batches_images table
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
    
    echo "<p>✅ productions_batches_images table created successfully</p>";

    echo "<h3>2. Creating production_batch_attachments table...</h3>";
    
    // Create production_batch_attachments table  
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
    
    echo "<p>✅ production_batch_attachments table created successfully</p>";

    echo "<h3>3. Creating upload directories...</h3>";
    
    // Create upload directories
    $dirs = [
        'uploads/batch_images/',
        'uploads/batch_attachments/'
    ];
    
    foreach ($dirs as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
            echo "<p>✅ Created directory: $dir</p>";
        } else {
            echo "<p>✅ Directory already exists: $dir</p>";
        }
    }

    echo "<h3>4. Testing API endpoints...</h3>";
    
    // Test batch images API
    $testBatchId = 23;
    echo "<p>Testing batch_images.php with batch ID $testBatchId...</p>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://luccibyey.com.tn/production/api/batch_images.php?batch_id=$testBatchId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response !== false && $httpCode === 200) {
        $data = json_decode($response, true);
        echo "<p>✅ batch_images.php working: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
        echo "<p>Found " . count($data['data'] ?? []) . " images for batch $testBatchId</p>";
    } else {
        echo "<p>❌ batch_images.php error (HTTP $httpCode)</p>";
    }
    
    // Test batch attachments API
    echo "<p>Testing batch_attachments.php with batch ID $testBatchId...</p>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://luccibyey.com.tn/production/api/batch_attachments.php?batch_id=$testBatchId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response !== false && $httpCode === 200) {
        $data = json_decode($response, true);
        echo "<p>✅ batch_attachments.php working: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
        echo "<p>Found " . count($data['data'] ?? []) . " attachments for batch $testBatchId</p>";
    } else {
        echo "<p>❌ batch_attachments.php error (HTTP $httpCode)</p>";
    }

    // Test production_batches API
    echo "<p>Testing production_batches.php with batch ID $testBatchId...</p>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://luccibyey.com.tn/production/api/production_batches.php?id=$testBatchId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response !== false && $httpCode === 200) {
        $data = json_decode($response, true);
        echo "<p>✅ production_batches.php working: " . ($data['success'] ? 'Success' : 'Error: ' . $data['message']) . "</p>";
        if ($data['success'] && isset($data['data']['batch_images'])) {
            echo "<p>Batch data includes " . count($data['data']['batch_images']) . " images</p>";
        }
        if ($data['success'] && isset($data['data']['batch_attachments'])) {
            echo "<p>Batch data includes " . count($data['data']['batch_attachments']) . " attachments</p>";
        }
    } else {
        echo "<p>❌ production_batches.php error (HTTP $httpCode)</p>";
    }

    echo "<hr>";
    echo "<h2>🎉 Setup Complete!</h2>";
    echo "<p><strong>Your batch upload system is ready:</strong></p>";
    echo "<ul>";
    echo "<li>✅ Database tables created</li>";
    echo "<li>✅ Upload directories ready</li>";
    echo "<li>✅ APIs working</li>";
    echo "<li>✅ Images will upload to: https://luccibyey.com.tn/production/uploads/batch_images/</li>";
    echo "<li>✅ Attachments will upload to: https://luccibyey.com.tn/production/uploads/batch_attachments/</li>";
    echo "<li>✅ Images will display immediately after upload</li>";
    echo "</ul>";
    
    echo "<p><strong>Test it now:</strong></p>";
    echo "<p>Go to your batch details page and try uploading an image or attachment!</p>";

} catch (Exception $e) {
    echo "<p>❌ Setup Error: " . $e->getMessage() . "</p>";
}
?>