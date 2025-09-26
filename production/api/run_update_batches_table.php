<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if columns already exist
    $stmt = $db->prepare("SHOW COLUMNS FROM production_batches LIKE 'product_type'");
    $stmt->execute();
    $productTypeExists = $stmt->fetch();
    
    $stmt = $db->prepare("SHOW COLUMNS FROM production_batches LIKE 'boutique_origin'");
    $stmt->execute();
    $boutiqueOriginExists = $stmt->fetch();
    
    if (!$productTypeExists) {
        $stmt = $db->prepare("ALTER TABLE `production_batches` ADD COLUMN `product_type` varchar(50) DEFAULT 'regular' COMMENT 'Type of product: regular or soustraitance'");
        $stmt->execute();
        echo "Added product_type column\n";
    } else {
        echo "product_type column already exists\n";
    }
    
    if (!$boutiqueOriginExists) {
        $stmt = $db->prepare("ALTER TABLE `production_batches` ADD COLUMN `boutique_origin` varchar(255) DEFAULT NULL COMMENT 'For soustraitance: client name, for regular: boutique name'");
        $stmt->execute();
        echo "Added boutique_origin column\n";
    } else {
        echo "boutique_origin column already exists\n";
    }
    
    // Update existing records to have product_type = 'regular'
    $stmt = $db->prepare("UPDATE `production_batches` SET `product_type` = 'regular' WHERE `product_type` IS NULL OR `product_type` = ''");
    $stmt->execute();
    echo "Updated existing records with product_type = 'regular'\n";
    
    echo "Database update completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>