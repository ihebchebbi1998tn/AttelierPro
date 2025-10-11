<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔧 Setting up laize column...\n\n";
    
    // Check if laize column already exists
    $stmt = $db->prepare("SHOW COLUMNS FROM production_matieres LIKE 'laize'");
    $stmt->execute();
    $laizeExists = $stmt->fetch();
    
    if (!$laizeExists) {
        echo "➕ Adding laize column...\n";
        $db->exec("ALTER TABLE `production_matieres` ADD COLUMN `laize` VARCHAR(100) NULL COMMENT 'Laize du matériau (largeur utilisable)' AFTER `taille`");
        echo "✅ laize column added successfully\n";
    } else {
        echo "⚠️  laize column already exists\n";
    }
    
    // Add index for better performance
    try {
        $db->exec("CREATE INDEX `idx_laize` ON `production_matieres` (`laize`)");
        echo "✅ Added index for laize\n";
    } catch (Exception $e) {
        echo "⚠️  Index for laize might already exist\n";
    }
    
    echo "\n🎉 Laize column setup completed successfully!\n";
    echo "📋 Summary:\n";
    echo "   - laize: VARCHAR(100) NULL for material width/laize\n";
    echo "   - Added performance index\n";
    
} catch (Exception $e) {
    echo "❌ Error during setup: " . $e->getMessage() . "\n";
    echo "🔍 Debug info: " . $e->getTraceAsString() . "\n";
}
?>