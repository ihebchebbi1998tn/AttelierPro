<?php
require_once 'config.php';

echo "<h2>Setting up Product Measurement Tables</h2>";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Read and execute the SQL file
    $sql = file_get_contents('create_product_measurement_tables.sql');
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $db->exec($statement . ';');
                echo "<p>✅ Executed: " . substr($statement, 0, 50) . "...</p>";
            } catch (Exception $e) {
                echo "<p>⚠️  Warning for statement: " . $e->getMessage() . "</p>";
                echo "<p>Statement: " . substr($statement, 0, 100) . "...</p>";
            }
        }
    }
    
    echo "<p><strong>✅ Product measurement tables setup completed!</strong></p>";
    echo "<p>Created tables:</p>";
    echo "<ul>";
    echo "<li>production_ready_products_mesure</li>";
    echo "<li>production_soustraitance_products_mesure</li>";
    echo "</ul>";
    echo "<p>APIs available at:</p>";
    echo "<ul>";
    echo "<li><a href='production_ready_products_mesure.php'>production_ready_products_mesure.php</a></li>";
    echo "<li><a href='production_soustraitance_products_mesure.php'>production_soustraitance_products_mesure.php</a></li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p>❌ Error during setup: " . $e->getMessage() . "</p>";
}
?>