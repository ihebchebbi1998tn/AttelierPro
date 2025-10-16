<?php
/**
 * Migration script to update salary configuration to 2025 Loi de Finances
 * This updates:
 * - CSS rate: 1% → 0.5%
 * - Chef de famille deduction: 150 TND → 300 TND
 * - Tax brackets to match 2025 annual barème
 */

require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Starting salary configuration update to 2025 values...\n\n";
    
    // Read and execute the SQL file
    $sqlFile = __DIR__ . '/update_salary_config_2025.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    $db->beginTransaction();
    
    foreach ($statements as $statement) {
        if (trim($statement)) {
            echo "Executing: " . substr($statement, 0, 80) . "...\n";
            $db->exec($statement);
        }
    }
    
    $db->commit();
    
    echo "\n✅ SUCCESS: Salary configuration updated to 2025 Loi de Finances\n\n";
    echo "Updated values:\n";
    echo "- CSS rate: 0.5% (was 1%)\n";
    echo "- Chef de famille deduction: 300 TND (was 150 TND)\n";
    echo "- Tax brackets: Updated to 2025 barème with 8 progressive brackets\n\n";
    
    // Verify updates
    $stmt = $db->query("SELECT * FROM production_salary_config ORDER BY config_key");
    $config = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Current configuration:\n";
    foreach ($config as $item) {
        echo "  - {$item['config_key']}: {$item['config_value']} ({$item['description']})\n";
    }
    
    echo "\nActive tax brackets:\n";
    $stmt = $db->query("SELECT * FROM production_tax_brackets WHERE active = 1 ORDER BY bracket_order");
    $brackets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($brackets as $bracket) {
        $max = $bracket['max_amount'] ? number_format($bracket['max_amount'], 3) : '∞';
        echo "  - Bracket {$bracket['bracket_order']}: {$bracket['min_amount']} - {$max} @ " . 
             ($bracket['tax_rate'] * 100) . "% - {$bracket['description']}\n";
    }
    
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
