<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Fixing foreign key constraint for production_batches...\n\n";
    
    // Get current database name
    $dbName = 'luccybcdb'; // Default database name
    
    // Check if the foreign key constraint exists
    $stmt = $db->query("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'production_batches' 
        AND COLUMN_NAME = 'product_id' 
        AND CONSTRAINT_NAME != 'PRIMARY'
        AND CONSTRAINT_NAME LIKE '%fk%' OR CONSTRAINT_NAME LIKE '%ibfk%'
    ");
    $constraints = $stmt->fetchAll();
    
    if ($constraints) {
        foreach ($constraints as $constraint) {
            echo "Found constraint: " . $constraint['CONSTRAINT_NAME'] . "\n";
            
            try {
                // Drop the foreign key constraint
                $db->exec("ALTER TABLE `production_batches` DROP FOREIGN KEY `" . $constraint['CONSTRAINT_NAME'] . "`");
                echo "✅ Dropped foreign key constraint: " . $constraint['CONSTRAINT_NAME'] . "\n";
            } catch (Exception $e) {
                echo "⚠️  Could not drop constraint " . $constraint['CONSTRAINT_NAME'] . ": " . $e->getMessage() . "\n";
            }
        }
    } else {
        echo "ℹ️  No foreign key constraints found for product_id\n";
    }
    
    // Also ensure the columns exist for soustraitance support
    $stmt = $db->query("SHOW COLUMNS FROM production_batches LIKE 'product_type'");
    $productTypeExists = $stmt->fetch();
    
    if (!$productTypeExists) {
        $db->exec("ALTER TABLE `production_batches` ADD COLUMN `product_type` VARCHAR(50) DEFAULT 'regular' COMMENT 'Type: regular or soustraitance'");
        echo "✅ Added product_type column\n";
    }
    
    $stmt = $db->query("SHOW COLUMNS FROM production_batches LIKE 'boutique_origin'");
    $boutiqueOriginExists = $stmt->fetch();
    
    if (!$boutiqueOriginExists) {
        $db->exec("ALTER TABLE `production_batches` ADD COLUMN `boutique_origin` VARCHAR(255) DEFAULT NULL COMMENT 'Client name for soustraitance, boutique for regular'");
        echo "✅ Added boutique_origin column\n";
    }
    
    echo "\n🎉 Foreign key constraint fix completed successfully!\n";
    echo "Production batches can now reference both regular and soustraitance products.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>