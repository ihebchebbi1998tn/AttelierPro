<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔧 Setting up materiere_type support...\n\n";
    
    // Check if columns already exist
    $stmt = $db->prepare("SHOW COLUMNS FROM production_matieres LIKE 'materiere_type'");
    $stmt->execute();
    $materiereTypeExists = $stmt->fetch();
    
    $stmt = $db->prepare("SHOW COLUMNS FROM production_matieres LIKE 'extern_customer_id'");
    $stmt->execute();
    $externCustomerIdExists = $stmt->fetch();
    
    if (!$materiereTypeExists) {
        echo "➕ Adding materiere_type column...\n";
        $db->exec("ALTER TABLE `production_matieres` ADD COLUMN `materiere_type` ENUM('intern', 'extern') DEFAULT 'intern' COMMENT 'Type de matière: intern (notre matière) ou extern (matière client)' AFTER `other_attributes`");
        echo "✅ materiere_type column added successfully\n";
    } else {
        echo "⚠️  materiere_type column already exists\n";
    }
    
    if (!$externCustomerIdExists) {
        echo "➕ Adding extern_customer_id column...\n";
        $db->exec("ALTER TABLE `production_matieres` ADD COLUMN `extern_customer_id` INT NULL COMMENT 'ID du client externe si materiere_type = extern' AFTER `materiere_type`");
        echo "✅ extern_customer_id column added successfully\n";
    } else {
        echo "⚠️  extern_customer_id column already exists\n";
    }
    
    // Add indexes for better performance
    try {
        $db->exec("CREATE INDEX `idx_materiere_type` ON `production_matieres` (`materiere_type`)");
        echo "✅ Added index for materiere_type\n";
    } catch (Exception $e) {
        echo "⚠️  Index for materiere_type might already exist\n";
    }
    
    try {
        $db->exec("CREATE INDEX `idx_extern_customer` ON `production_matieres` (`extern_customer_id`)");
        echo "✅ Added index for extern_customer_id\n";
    } catch (Exception $e) {
        echo "⚠️  Index for extern_customer_id might already exist\n";
    }
    
    echo "\n🎉 Materiere type support setup completed successfully!\n";
    echo "📋 Summary:\n";
    echo "   - materiere_type: ENUM('intern', 'extern') DEFAULT 'intern'\n";
    echo "   - extern_customer_id: INT NULL for external customer tracking\n";
    echo "   - Added performance indexes\n";
    
} catch (Exception $e) {
    echo "❌ Error during setup: " . $e->getMessage() . "\n";
    echo "🔍 Debug info: " . $e->getTraceAsString() . "\n";
}
?>