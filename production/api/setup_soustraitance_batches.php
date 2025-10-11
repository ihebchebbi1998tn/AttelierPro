<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Setting up soustraitance support for production_batches table...\n\n";
    
    // Check if columns exist
    $stmt = $db->query("SHOW COLUMNS FROM production_batches LIKE 'product_type'");
    $productTypeExists = $stmt->fetch();
    
    $stmt = $db->query("SHOW COLUMNS FROM production_batches LIKE 'boutique_origin'");  
    $boutiqueOriginExists = $stmt->fetch();
    
    if (!$productTypeExists) {
        $db->exec("ALTER TABLE `production_batches` ADD COLUMN `product_type` VARCHAR(50) DEFAULT 'regular' COMMENT 'Type: regular or soustraitance'");
        echo "✅ Added product_type column\n";
    } else {
        echo "ℹ️  product_type column already exists\n";
    }
    
    if (!$boutiqueOriginExists) {
        $db->exec("ALTER TABLE `production_batches` ADD COLUMN `boutique_origin` VARCHAR(255) DEFAULT NULL COMMENT 'Client name for soustraitance, boutique for regular'");
        echo "✅ Added boutique_origin column\n";
    } else {
        echo "ℹ️  boutique_origin column already exists\n";
    }
    
    // Update existing records
    $stmt = $db->exec("UPDATE `production_batches` SET `product_type` = 'regular' WHERE `product_type` IS NULL OR `product_type` = ''");
    echo "✅ Updated {$stmt} existing records with product_type = 'regular'\n";
    
    // Update boutique_origin for existing regular products
    $stmt = $db->prepare("
        UPDATE `production_batches` b
        JOIN `production_ready_products` p ON b.product_id = p.id
        SET b.boutique_origin = p.boutique_origin
        WHERE b.product_type = 'regular' AND b.boutique_origin IS NULL
    ");
    $stmt->execute();
    $updated = $stmt->rowCount();
    echo "✅ Updated boutique_origin for {$updated} existing regular products\n";
    
    echo "\n🎉 Database setup completed successfully!\n";
    echo "Now you can use soustraitance production features.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>