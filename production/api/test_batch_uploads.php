<?php
require_once 'config.php';

// Test batch upload functionality and database setup
header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Testing batch upload system...\n\n";
    
    // Test 1: Check production_images table exists and has batch support
    echo "1. Testing production_images table:\n";
    try {
        $stmt = $db->query("DESCRIBE production_images");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $requiredColumns = ['image_id', 'related_type', 'related_id', 'file_path', 'uploaded_user', 'upload_date', 'description'];
        $hasAllColumns = true;
        
        foreach ($requiredColumns as $col) {
            if (!in_array($col, $columns)) {
                echo "   ❌ Missing column: $col\n";
                $hasAllColumns = false;
            } else {
                echo "   ✅ Has column: $col\n";
            }
        }
        
        if ($hasAllColumns) {
            echo "   ✅ production_images table is ready for batch uploads\n";
        }
        
        // Check if description column exists, if not add it
        if (!in_array('description', $columns)) {
            echo "   🔧 Adding description column...\n";
            $db->exec("ALTER TABLE production_images ADD COLUMN description TEXT");
            echo "   ✅ Description column added\n";
        }
        
    } catch (Exception $e) {
        echo "   ❌ Error checking production_images: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Test 2: Check/Create production_batch_attachments table
    echo "2. Testing production_batch_attachments table:\n";
    try {
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
        
        echo "   ✅ production_batch_attachments table created/verified\n";
        
        // Verify table structure
        $stmt = $db->query("DESCRIBE production_batch_attachments");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($columns as $column) {
            echo "   📋 Column: {$column['Field']} ({$column['Type']})\n";
        }
        
    } catch (Exception $e) {
        echo "   ❌ Error with production_batch_attachments: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Test 3: Check upload directories
    echo "3. Testing upload directories:\n";
    
    $directories = [
        'uploads/batch_images/',
        'uploads/batch_attachments/'
    ];
    
    foreach ($directories as $dir) {
        if (!file_exists($dir)) {
            if (mkdir($dir, 0777, true)) {
                echo "   ✅ Created directory: $dir\n";
            } else {
                echo "   ❌ Failed to create directory: $dir\n";
            }
        } else {
            echo "   ✅ Directory exists: $dir\n";
        }
        
        // Test write permissions
        $testFile = $dir . 'test_' . time() . '.txt';
        if (file_put_contents($testFile, 'test')) {
            echo "   ✅ Write permissions OK for: $dir\n";
            unlink($testFile);
        } else {
            echo "   ❌ No write permissions for: $dir\n";
        }
    }
    
    echo "\n";
    
    // Test 4: Sample batch data for testing
    echo "4. Sample batch data:\n";
    try {
        $stmt = $db->query("SELECT id, batch_reference FROM production_batches LIMIT 5");
        $batches = $stmt->fetchAll();
        
        if (count($batches) > 0) {
            echo "   ✅ Available test batches:\n";
            foreach ($batches as $batch) {
                echo "      - ID: {$batch['id']}, Reference: {$batch['batch_reference']}\n";
            }
        } else {
            echo "   ⚠️  No batches found for testing\n";
        }
        
    } catch (Exception $e) {
        echo "   ❌ Error checking batches: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Test 5: API endpoint URLs
    echo "5. API endpoint URLs:\n";
    echo "   📡 Batch Images API: https://luccibyey.com.tn/production/api/batch_images.php\n";
    echo "   📡 Batch Attachments API: https://luccibyey.com.tn/production/api/batch_attachments.php\n";
    echo "   📡 This test API: https://luccibyey.com.tn/production/api/test_batch_uploads.php\n";
    
    echo "\n✅ Batch upload system test completed!\n";
    echo "\nNext steps:\n";
    echo "1. Upload images via: POST to batch_images.php with 'image', 'batch_id', 'description'\n";
    echo "2. Upload files via: POST to batch_attachments.php with 'file', 'batch_id', 'description'\n";
    echo "3. View uploads via: GET batch_images.php?batch_id=X or batch_attachments.php?batch_id=X\n";
    
} catch (Exception $e) {
    echo "❌ Critical error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>