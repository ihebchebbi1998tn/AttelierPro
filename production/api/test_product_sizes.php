<?php
echo "<h2>Product Sizes API Test</h2>";

// Test database connection
require_once 'config.php';
$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    // Check if table exists
    try {
        $result = $db->query("DESCRIBE product_sizes_config");
        echo "<p style='color: green;'>✓ product_sizes_config table exists</p>";
        
        // Show table structure
        echo "<h3>Table Structure:</h3>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
        while ($row = $result->fetch()) {
            echo "<tr>";
            echo "<td>{$row['Field']}</td>";
            echo "<td>{$row['Type']}</td>";
            echo "<td>{$row['Null']}</td>";
            echo "<td>{$row['Key']}</td>";
            echo "<td>{$row['Default']}</td>";
            echo "<td>{$row['Extra']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Count existing records
        $count_query = $db->query("SELECT COUNT(*) as total FROM product_sizes_config");
        $count = $count_query->fetch();
        echo "<p>Total records in product_sizes_config: {$count['total']}</p>";
        
        // Sample data
        if ($count['total'] > 0) {
            echo "<h3>Sample Data (first 10 records):</h3>";
            $sample_query = $db->query("SELECT * FROM product_sizes_config LIMIT 10");
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>ID</th><th>Product ID</th><th>Size Type</th><th>Size Value</th><th>Active</th><th>Created At</th></tr>";
            while ($row = $sample_query->fetch()) {
                echo "<tr>";
                echo "<td>{$row['id']}</td>";
                echo "<td>{$row['product_id']}</td>";
                echo "<td>{$row['size_type']}</td>";
                echo "<td>{$row['size_value']}</td>";
                echo "<td>{$row['is_active']}</td>";
                echo "<td>{$row['created_at']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ Table error: " . $e->getMessage() . "</p>";
        echo "<p>Please run the SQL script: create_product_sizes_table.sql</p>";
    }
    
} else {
    echo "<p style='color: red;'>✗ Database connection failed</p>";
}

echo "<hr>";
echo "<h3>API Endpoints Available:</h3>";
echo "<ul>";
echo "<li><strong>GET</strong> product_sizes.php?product_id=1 - Get sizes for product</li>";
echo "<li><strong>POST</strong> product_sizes.php - Create/update sizes configuration</li>";
echo "<li><strong>PUT</strong> product_sizes.php - Update sizes configuration</li>";
echo "<li><strong>DELETE</strong> product_sizes.php?product_id=1 - Delete all sizes for product</li>";
echo "<li><strong>POST</strong> init_product_sizes.php - Initialize sizes for products</li>";
echo "</ul>";

echo "<h3>Test API Calls:</h3>";
echo "<p><a href='product_sizes.php?product_id=1' target='_blank'>Test GET sizes for product 1</a></p>";
echo "<p><a href='init_product_sizes.php' target='_blank'>View init sizes API</a></p>";
?>