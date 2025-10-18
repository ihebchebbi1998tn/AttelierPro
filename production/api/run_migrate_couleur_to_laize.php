<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔧 Starting data migration: couleur -> laize, reference -> couleur...\n\n";
    
    // First, let's check the current state
    $stmt = $db->prepare("SELECT COUNT(*) as total, 
                                 COUNT(CASE WHEN couleur IS NOT NULL AND couleur != '' THEN 1 END) as with_couleur,
                                 COUNT(CASE WHEN reference IS NOT NULL AND reference != '' THEN 1 END) as with_reference,
                                 COUNT(CASE WHEN laize IS NOT NULL AND laize != '' THEN 1 END) as with_laize
                          FROM production_matieres");
    $stmt->execute();
    $before = $stmt->fetch();
    
    echo "📊 Current state:\n";
    echo "   - Total records: {$before['total']}\n";
    echo "   - Records with couleur: {$before['with_couleur']}\n";
    echo "   - Records with reference: {$before['with_reference']}\n";
    echo "   - Records with laize: {$before['with_laize']}\n\n";
    
    // Perform the migration
    echo "🚀 Performing data migration...\n";
    
    // Move couleur to laize and copy reference to couleur
    $stmt = $db->prepare("
        UPDATE production_matieres 
        SET 
            laize = couleur,
            couleur = reference
        WHERE 
            couleur IS NOT NULL OR reference IS NOT NULL
    ");
    
    $result = $stmt->execute();
    $rowsAffected = $stmt->rowCount();
    
    if ($result) {
        echo "✅ Migration completed successfully!\n";
        echo "📈 Rows affected: $rowsAffected\n\n";
        
        // Check the new state
        $stmt = $db->prepare("SELECT COUNT(*) as total, 
                                     COUNT(CASE WHEN couleur IS NOT NULL AND couleur != '' THEN 1 END) as with_couleur,
                                     COUNT(CASE WHEN reference IS NOT NULL AND reference != '' THEN 1 END) as with_reference,
                                     COUNT(CASE WHEN laize IS NOT NULL AND laize != '' THEN 1 END) as with_laize
                              FROM production_matieres");
        $stmt->execute();
        $after = $stmt->fetch();
        
        echo "📊 New state:\n";
        echo "   - Total records: {$after['total']}\n";
        echo "   - Records with couleur: {$after['with_couleur']}\n";
        echo "   - Records with reference: {$after['with_reference']}\n";
        echo "   - Records with laize: {$after['with_laize']}\n\n";
        
        echo "🎉 Data migration completed successfully!\n";
        echo "📋 Summary of changes:\n";
        echo "   - Moved couleur data to laize column\n";
        echo "   - Copied reference data to couleur column\n";
        echo "   - Laize records increased from {$before['with_laize']} to {$after['with_laize']}\n";
        
    } else {
        echo "❌ Migration failed!\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error during migration: " . $e->getMessage() . "\n";
    echo "🔍 Debug info: " . $e->getTraceAsString() . "\n";
}
?>