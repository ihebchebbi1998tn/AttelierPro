<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

echo "<h2>Setting up Soustraitance Products Table</h2>";

try {
    // Create table
    $db->exec("CREATE TABLE IF NOT EXISTS production_soustraitance_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        boutique_origin VARCHAR(50) DEFAULT 'soustraitance',
        external_product_id VARCHAR(100),
        reference_product VARCHAR(100),
        nom_product VARCHAR(255) NOT NULL,
        img_product VARCHAR(500),
        img2_product VARCHAR(500),
        img3_product VARCHAR(500),
        img4_product VARCHAR(500),
        img5_product VARCHAR(500),
        description_product TEXT,
        type_product VARCHAR(100),
        category_product VARCHAR(100),
        itemgroup_product VARCHAR(100),
        price_product DECIMAL(10,2) DEFAULT 0.00,
        qnty_product INT DEFAULT 0,
        color_product VARCHAR(100),
        collection_product VARCHAR(100),
        status_product VARCHAR(50) DEFAULT 'active',
        auto_replenishment TINYINT(1) DEFAULT 0,
        auto_replenishment_quantity INT DEFAULT 0,
        auto_replenishment_quantity_sizes JSON,
        sizes_data JSON,
        discount_product DECIMAL(5,2) DEFAULT 0.00,
        related_products TEXT,
        createdate_product TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Sizes (renamed for consistency)
        size_xs INT DEFAULT 0,
        size_s INT DEFAULT 0,
        size_m INT DEFAULT 0,
        size_l INT DEFAULT 0,
        size_xl INT DEFAULT 0,
        size_xxl INT DEFAULT 0,
        size_3xl INT DEFAULT 0,
        size_4xl INT DEFAULT 0,
        
        size_30 INT DEFAULT 0,
        size_31 INT DEFAULT 0,
        size_32 INT DEFAULT 0,
        size_33 INT DEFAULT 0,
        size_34 INT DEFAULT 0,
        size_36 INT DEFAULT 0,
        size_38 INT DEFAULT 0,
        size_39 INT DEFAULT 0,
        size_40 INT DEFAULT 0,
        size_41 INT DEFAULT 0,
        size_42 INT DEFAULT 0,
        size_43 INT DEFAULT 0,
        size_44 INT DEFAULT 0,
        size_45 INT DEFAULT 0,
        size_46 INT DEFAULT 0,
        size_47 INT DEFAULT 0,
        size_48 INT DEFAULT 0,
        size_50 INT DEFAULT 0,
        size_52 INT DEFAULT 0,
        size_54 INT DEFAULT 0,
        size_56 INT DEFAULT 0,
        size_58 INT DEFAULT 0,
        size_60 INT DEFAULT 0,
        size_62 INT DEFAULT 0,
        size_64 INT DEFAULT 0,
        size_66 INT DEFAULT 0,
        size_85 INT DEFAULT 0,
        size_90 INT DEFAULT 0,
        size_95 INT DEFAULT 0,
        size_100 INT DEFAULT 0,
        size_105 INT DEFAULT 0,
        size_110 INT DEFAULT 0,
        size_115 INT DEFAULT 0,
        size_120 INT DEFAULT 0,
        size_125 INT DEFAULT 0,

        materials_configured TINYINT(1) DEFAULT 0,
        sync_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_client_id (client_id),
        INDEX idx_status (status_product),
        INDEX idx_category (category_product),

        FOREIGN KEY (client_id) REFERENCES production_soustraitance_clients(id) ON DELETE CASCADE
    )");
    echo "<p>✅ Created production_soustraitance_products table</p>";
    
    // Create uploads directory
    $uploadDir = 'uploads/soustraitance_products/';
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
    echo "<p>You can now manage soustraitance products at: <a href='soustraitance_products.php'>soustraitance_products.php</a></p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error during setup: " . $e->getMessage() . "</p>";
}
?>