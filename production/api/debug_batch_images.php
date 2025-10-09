<?php
require_once 'config.php';

echo "<h3>Debug Batch Images - Batch ID 23</h3>";
echo "<hr>";

$database = new Database();
$db = $database->getConnection();

$batchId = 23;

try {
    echo "<h4>1. Checking if productions_batches_images table exists:</h4>";
    
    $checkTable = $db->prepare("SHOW TABLES LIKE 'productions_batches_images'");
    $checkTable->execute();
    $tableExists = $checkTable->fetch();
    
    if ($tableExists) {
        echo "<p style='color: green;'>✅ Table productions_batches_images exists</p>";
        
        // Get all images for batch
        echo "<h4>2. Querying images for batch $batchId:</h4>";
        $stmt = $db->prepare("
            SELECT id, batch_id, image_path, original_filename, file_size, description, uploaded_by, created_at
            FROM productions_batches_images 
            WHERE batch_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->execute([$batchId]);
        $images = $stmt->fetchAll();
        
        echo "<p><strong>Found " . count($images) . " images:</strong></p>";
        
        if (count($images) > 0) {
            foreach($images as $image) {
                $full_url = 'https://luccibyey.com.tn/production/' . $image['image_path'];
                
                echo "<div style='border: 2px solid #333; margin: 10px; padding: 15px; background: #f9f9f9;'>";
                echo "<h5>Image ID: " . $image['id'] . "</h5>";
                echo "<p><strong>Database Path:</strong> <code>" . $image['image_path'] . "</code></p>";
                echo "<p><strong>Full URL:</strong> <a href='$full_url' target='_blank' style='color: blue;'>$full_url</a></p>";
                echo "<p><strong>Original Filename:</strong> " . $image['original_filename'] . "</p>";
                echo "<p><strong>File Size:</strong> " . number_format($image['file_size']) . " bytes</p>";
                echo "<p><strong>Description:</strong> " . ($image['description'] ?: 'No description') . "</p>";
                echo "<p><strong>Uploaded:</strong> " . $image['created_at'] . "</p>";
                
                // Check if physical file exists
                if (file_exists($image['image_path'])) {
                    echo "<p style='color: green; font-weight: bold;'>✅ Physical file EXISTS on server</p>";
                } else {
                    echo "<p style='color: red; font-weight: bold;'>❌ Physical file NOT FOUND on server</p>";
                    echo "<p style='color: red;'>Expected location: " . realpath('.') . "/" . $image['image_path'] . "</p>";
                }
                
                // Test if URL is accessible
                echo "<p><strong>Image Preview:</strong></p>";
                echo "<img src='$full_url' style='max-width: 300px; max-height: 200px; border: 1px solid #ccc;' ";
                echo "onload=\"this.nextSibling.innerHTML='✅ Image loads successfully'\" ";
                echo "onerror=\"this.nextSibling.innerHTML='❌ Image failed to load - broken URL or missing file'\" />";
                echo "<p style='font-weight: bold; margin-top: 5px;'>Loading...</p>";
                
                echo "</div>";
            }
        } else {
            echo "<p style='color: orange; font-weight: bold;'>⚠️ No images found for batch $batchId</p>";
            
            // Check if there are ANY images in the table
            $allStmt = $db->prepare("SELECT COUNT(*) as total FROM productions_batches_images");
            $allStmt->execute();
            $total = $allStmt->fetch();
            echo "<p>Total images in database: " . $total['total'] . "</p>";
        }
        
    } else {
        echo "<p style='color: red;'>❌ Table productions_batches_images does NOT exist</p>";
        echo "<p>Need to run the setup script first!</p>";
    }
    
    echo "<hr>";
    echo "<h4>3. Testing API Endpoint:</h4>";
    
    $apiUrl = "https://luccibyey.com.tn/production/api/batch_images.php?batch_id=$batchId";
    echo "<p><strong>API URL:</strong> <a href='$apiUrl' target='_blank'>$apiUrl</a></p>";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response !== false && $httpCode === 200) {
        $data = json_decode($response, true);
        echo "<p style='color: green;'>✅ API accessible (HTTP $httpCode)</p>";
        echo "<p><strong>API Response:</strong></p>";
        echo "<pre style='background: #f0f0f0; padding: 10px; overflow-x: auto;'>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p style='color: red;'>❌ API not accessible (HTTP $httpCode)</p>";
        echo "<p>Response: " . ($response ?: 'No response') . "</p>";
    }
    
    echo "<hr>";
    echo "<h4>4. Directory Check:</h4>";
    
    $uploadDir = 'uploads/batch_images/';
    if (is_dir($uploadDir)) {
        echo "<p style='color: green;'>✅ Upload directory exists: $uploadDir</p>";
        
        $files = scandir($uploadDir);
        $imageFiles = array_filter($files, function($file) {
            return !in_array($file, ['.', '..']) && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file);
        });
        
        echo "<p>Files in upload directory: " . count($imageFiles) . "</p>";
        if (count($imageFiles) > 0) {
            echo "<ul>";
            foreach($imageFiles as $file) {
                echo "<li>$file</li>";
            }
            echo "</ul>";
        }
    } else {
        echo "<p style='color: red;'>❌ Upload directory does NOT exist: $uploadDir</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>