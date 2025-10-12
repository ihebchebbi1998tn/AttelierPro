<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

echo "<h2>Updating Soustraitance Products Table Structure</h2>";

try {
    // Check if table exists
    $tableExists = $db->query("SHOW TABLES LIKE 'production_soustraitance_products'")->fetch();
    
    if (!$tableExists) {
        echo "<p>⚠️ Table doesn't exist. Please run setup_soustraitance_products_table.php first.</p>";
        exit;
    }
    
    // Get current table structure
    $columns = $db->query("SHOW COLUMNS FROM production_soustraitance_products")->fetchAll();
    $existingColumns = array_column($columns, 'Field');
    
    // Map old column names to new ones
    $columnMapping = [
        's_size' => 'size_s',
        'm_size' => 'size_m',
        'l_size' => 'size_l',
        'xl_size' => 'size_xl',
        'xxl_size' => 'size_xxl',
        '3xl_size' => 'size_3xl',
        '4xl_size' => 'size_4xl',
        'xs_size' => 'size_xs',
        '30_size' => 'size_30',
        '31_size' => 'size_31',
        '32_size' => 'size_32',
        '33_size' => 'size_33',
        '34_size' => 'size_34',
        '36_size' => 'size_36',
        '38_size' => 'size_38',
        '39_size' => 'size_39',
        '40_size' => 'size_40',
        '41_size' => 'size_41',
        '42_size' => 'size_42',
        '43_size' => 'size_43',
        '44_size' => 'size_44',
        '45_size' => 'size_45',
        '46_size' => 'size_46',
        '47_size' => 'size_47',
        '48_size' => 'size_48',
        '50_size' => 'size_50',
        '52_size' => 'size_52',
        '54_size' => 'size_54',
        '56_size' => 'size_56',
        '58_size' => 'size_58',
        '60_size' => 'size_60',
        '62_size' => 'size_62',
        '64_size' => 'size_64',
        '66_size' => 'size_66',
        '85_size' => 'size_85',
        '90_size' => 'size_90',
        '95_size' => 'size_95',
        '100_size' => 'size_100',
        '105_size' => 'size_105',
        '110_size' => 'size_110',
        '115_size' => 'size_115',
        '120_size' => 'size_120',
        '125_size' => 'size_125'
    ];
    
    $renamedColumns = [];
    
    // Rename columns if they exist with old names
    foreach ($columnMapping as $oldName => $newName) {
        if (in_array($oldName, $existingColumns) && !in_array($newName, $existingColumns)) {
            try {
                $db->exec("ALTER TABLE production_soustraitance_products CHANGE COLUMN `$oldName` `$newName` INT DEFAULT 0");
                $renamedColumns[] = "$oldName → $newName";
                echo "<p>✅ Renamed column: $oldName → $newName</p>";
            } catch (Exception $e) {
                echo "<p>❌ Failed to rename column $oldName: " . $e->getMessage() . "</p>";
            }
        }
    }
    
    // Add missing columns with new names
    $newColumns = array_values($columnMapping);
    foreach ($newColumns as $columnName) {
        if (!in_array($columnName, $existingColumns)) {
            try {
                $db->exec("ALTER TABLE production_soustraitance_products ADD COLUMN `$columnName` INT DEFAULT 0");
                echo "<p>✅ Added missing column: $columnName</p>";
            } catch (Exception $e) {
                echo "<p>❌ Failed to add column $columnName: " . $e->getMessage() . "</p>";
            }
        }
    }
    
    if (empty($renamedColumns)) {
        echo "<p>✅ Table structure is already up to date!</p>";
    } else {
        echo "<p><strong>Updated " . count($renamedColumns) . " columns:</strong></p>";
        foreach ($renamedColumns as $rename) {
            echo "<p>- $rename</p>";
        }
    }
    
    echo "<p><strong>Update completed successfully!</strong></p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error during update: " . $e->getMessage() . "</p>";
}
?>