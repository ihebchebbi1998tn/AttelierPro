<?php
require_once 'config.php';

echo "<h2>Setting up Product Measurement Tables with Size Support</h2>";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Read and execute the SQL file
    $sql = file_get_contents('create_product_measurements_by_size.sql');
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $db->exec($statement . ';');
                echo "<p>✅ Executed: " . substr($statement, 0, 80) . "...</p>";
            } catch (Exception $e) {
                echo "<p>⚠️  Warning for statement: " . $e->getMessage() . "</p>";
                echo "<p>Statement: " . substr($statement, 0, 100) . "...</p>";
            }
        }
    }
    
    echo "<p><strong>✅ Product measurement tables with size support setup completed!</strong></p>";
    echo "<p>Updated tables:</p>";
    echo "<ul>";
    echo "<li>production_ready_products_mesure (with size support)</li>";
    echo "<li>production_soustraitance_products_mesure (with size support)</li>";
    echo "</ul>";
    echo "<p>New structure includes:</p>";
    echo "<ul>";
    echo "<li>Measurements per size (S, M, L, XL, etc.)</li>";
    echo "<li>Unique constraint on product_id + measurement_name + size_value</li>";
    echo "<li>Support for infinite measurement types</li>";
    echo "<li>Tolerance per measurement type</li>";
    echo "</ul>";
    echo "<p>APIs available at:</p>";
    echo "<ul>";
    echo "<li><a href='production_ready_products_mesure_by_size.php'>production_ready_products_mesure_by_size.php</a></li>";
    echo "<li><a href='production_soustraitance_products_mesure_by_size.php'>production_soustraitance_products_mesure_by_size.php</a></li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p>❌ Error during setup: " . $e->getMessage() . "</p>";
}
?>