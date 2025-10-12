<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔧 Fixing migration: restoring correct data mapping...\n\n";
    
    // Check current problematic state
    $stmt = $db->prepare("
        SELECT id, nom, reference, couleur, laize 
        FROM production_matieres 
        WHERE reference = couleur AND couleur = laize 
        LIMIT 10
    ");
    $stmt->execute();
    $duplicates = $stmt->fetchAll();
    
    echo "📊 Found " . count($duplicates) . " records where reference = couleur = laize\n";
    if (count($duplicates) > 0) {
        echo "Sample problematic records:\n";
        foreach (array_slice($duplicates, 0, 5) as $record) {
            echo "   ID {$record['id']}: ref='{$record['reference']}' couleur='{$record['couleur']}' laize='{$record['laize']}'\n";
        }
        echo "\n";
    }
    
    echo "🚀 Applying fix...\n";
    echo "Strategy: Clear laize and couleur, then restore proper mapping\n\n";
    
    // Step 1: Clear the incorrectly migrated data
    echo "Step 1: Clearing incorrect laize data...\n";
    $stmt = $db->prepare("UPDATE production_matieres SET laize = NULL WHERE reference = couleur AND couleur = laize");
    $stmt->execute();
    echo "✅ Cleared laize for problematic records\n";
    
    // Step 2: Clear couleur where it equals reference (incorrect copy)
    echo "Step 2: Clearing couleur where it incorrectly equals reference...\n";
    $stmt = $db->prepare("UPDATE production_matieres SET couleur = NULL WHERE reference = couleur");
    $stmt->execute();
    echo "✅ Cleared incorrect couleur data\n";
    
    // Step 3: Now we need to restore original values
    // Since we don't have original backup, we'll ask user to specify the correct approach
    echo "\n⚠️  IMPORTANT: Original data was lost during migration.\n";
    echo "To complete the fix, you need to:\n";
    echo "1. If you have a backup of original data, restore couleur from it\n";
    echo "2. Or manually set the correct couleur values for your materials\n";
    echo "3. Then laize can be set with the original couleur values\n\n";
    
    // Show current state
    $stmt = $db->prepare("SELECT COUNT(*) as total, 
                                 COUNT(CASE WHEN couleur IS NOT NULL AND couleur != '' THEN 1 END) as with_couleur,
                                 COUNT(CASE WHEN reference IS NOT NULL AND reference != '' THEN 1 END) as with_reference,
                                 COUNT(CASE WHEN laize IS NOT NULL AND laize != '' THEN 1 END) as with_laize
                          FROM production_matieres");
    $stmt->execute();
    $current = $stmt->fetch();
    
    echo "📊 Current state after cleanup:\n";
    echo "   - Total records: {$current['total']}\n";
    echo "   - Records with couleur: {$current['with_couleur']}\n";
    echo "   - Records with reference: {$current['with_reference']}\n";
    echo "   - Records with laize: {$current['with_laize']}\n\n";
    
    echo "🎯 Next steps:\n";
    echo "1. Restore original couleur values (from backup or manually)\n";
    echo "2. Run the correct migration: laize = original_couleur, couleur = reference\n";
    
} catch (Exception $e) {
    echo "❌ Error during fix: " . $e->getMessage() . "\n";
    echo "🔍 Debug info: " . $e->getTraceAsString() . "\n";
}
?>