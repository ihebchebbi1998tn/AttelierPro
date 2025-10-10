<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

echo "<h2>Setting up Product Attachments Table</h2>";

try {
    // Drop existing table if it has foreign key issues
    $db->exec("DROP TABLE IF EXISTS production_products_attachments");
    echo "<p>✅ Dropped existing table (if any)</p>";
    
    // Create table without foreign key constraint to avoid issues
    $db->exec("CREATE TABLE production_products_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
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
        INDEX idx_product_id (product_id)
    )");
    echo "<p>✅ Created production_products_attachments table</p>";
    
    // Create uploads directory
    $uploadDir = 'uploads/product_attachments/';
    if (!file_exists($uploadDir)) {
        if (mkdir($uploadDir, 0777, true)) {
            echo "<p>✅ Created uploads directory: $uploadDir</p>";
        } else {
            echo "<p>❌ Failed to create uploads directory: $uploadDir</p>";
        }
    } else {
        echo "<p>✅ Uploads directory already exists: $uploadDir</p>";
    }
    
    // Set directory permissions
    chmod($uploadDir, 0777);
    echo "<p>✅ Set directory permissions to 777</p>";
    
    echo "<p><strong>Setup completed successfully!</strong></p>";
    echo "<p>You can now test file uploads at: <a href='product_attachments.php?product_id=8'>product_attachments.php?product_id=8</a></p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error during setup: " . $e->getMessage() . "</p>";
}
?>