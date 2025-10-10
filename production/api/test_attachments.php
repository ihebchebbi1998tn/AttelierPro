<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

echo "<h2>Testing Product Attachments System</h2>";

// Test database connection
try {
    $stmt = $db->query("SELECT 1");
    echo "<p>✅ Database connection: OK</p>";
} catch (Exception $e) {
    echo "<p>❌ Database connection failed: " . $e->getMessage() . "</p>";
    exit;
}

// Check if table exists
try {
    $stmt = $db->query("DESCRIBE production_products_attachments");
    echo "<p>✅ Table 'production_products_attachments' exists</p>";
    
    // Show table structure
    echo "<h3>Table Structure:</h3>";
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    while ($row = $stmt->fetch()) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($row['Default']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p>❌ Table 'production_products_attachments' does not exist</p>";
    echo "<p>Please run the SQL script: create_product_attachments_table.sql</p>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}

// Check if uploads directory exists
$uploadDir = 'uploads/product_attachments/';
if (!file_exists($uploadDir)) {
    if (mkdir($uploadDir, 0777, true)) {
        echo "<p>✅ Created uploads directory: $uploadDir</p>";
    } else {
        echo "<p>❌ Failed to create uploads directory: $uploadDir</p>";
    }
} else {
    echo "<p>✅ Uploads directory exists: $uploadDir</p>";
}

// Check directory permissions
if (is_writable($uploadDir)) {
    echo "<p>✅ Uploads directory is writable</p>";
} else {
    echo "<p>❌ Uploads directory is not writable</p>";
}

// Test API endpoint availability
echo "<h3>API Endpoint Test:</h3>";
echo "<p>GET endpoint: <code>product_attachments.php?product_id=1</code></p>";
echo "<p>POST endpoint: <code>product_attachments.php</code> (requires file upload)</p>";
echo "<p>DELETE endpoint: <code>product_attachments.php</code> (requires JSON body with id)</p>";

// Show existing attachments count
try {
    $stmt = $db->query("SELECT COUNT(*) as total FROM production_products_attachments");
    $result = $stmt->fetch();
    echo "<p>Total attachments in database: " . $result['total'] . "</p>";
} catch (Exception $e) {
    echo "<p>Could not count attachments: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><strong>Setup Instructions:</strong></p>";
echo "<ol>";
echo "<li>Run the SQL script: <code>create_product_attachments_table.sql</code></li>";
echo "<li>Ensure the uploads directory has write permissions</li>";
echo "<li>Test file uploads through the ProductAttachments component</li>";
echo "</ol>";
?>