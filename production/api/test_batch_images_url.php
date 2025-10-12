<?php
require_once 'config.php';

echo "<h3>Testing Batch Images URL Structure</h3>";

$database = new Database();
$db = $database->getConnection();

$testBatchId = 23;

try {
    // Get images from database
    $stmt = $db->prepare("
        SELECT id, batch_id, image_path, original_filename, file_size, description, uploaded_by, created_at
        FROM productions_batches_images 
        WHERE batch_id = ?
        ORDER BY created_at ASC
    ");
    $stmt->execute([$testBatchId]);
    $images = $stmt->fetchAll();
    
    echo "<p><strong>Found " . count($images) . " images for batch $testBatchId:</strong></p>";
    
    foreach($images as $image) {
        $full_url = 'https://luccibyey.com.tn/production/' . $image['image_path'];
        
        echo "<div style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>";
        echo "<p><strong>ID:</strong> " . $image['id'] . "</p>";
        echo "<p><strong>Path in DB:</strong> " . $image['image_path'] . "</p>";
        echo "<p><strong>Full URL:</strong> <a href='$full_url' target='_blank'>$full_url</a></p>";
        echo "<p><strong>Original Filename:</strong> " . $image['original_filename'] . "</p>";
        echo "<p><strong>Description:</strong> " . ($image['description'] ?: 'No description') . "</p>";
        
        // Check if file exists
        if (file_exists($image['image_path'])) {
            echo "<p style='color: green;'>✅ File exists on server</p>";
        } else {
            echo "<p style='color: red;'>❌ File NOT found on server</p>";
        }
        
        // Show image preview
        echo "<p><strong>Preview:</strong></p>";
        echo "<img src='$full_url' style='max-width: 200px; max-height: 150px;' onerror=\"this.style.display='none'; this.nextSibling.style.display='block';\" />";
        echo "<p style='display: none; color: red;'>❌ Image failed to load</p>";
        echo "</div>";
    }
    
    // Test API endpoint
    echo "<hr>";
    echo "<h4>Testing API Endpoint:</h4>";
    
    $apiUrl = "https://luccibyey.com.tn/production/api/batch_images.php?batch_id=$testBatchId";
    $response = @file_get_contents($apiUrl);
    
    if ($response) {
        $data = json_decode($response, true);
        echo "<p><strong>API Response:</strong></p>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p style='color: red;'>❌ Failed to fetch from API</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>