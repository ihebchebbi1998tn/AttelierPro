<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

// Read and execute the SQL file
$sql = "
CREATE TABLE IF NOT EXISTS product_measurement_scales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    measurement_types JSON DEFAULT NULL COMMENT 'Array of measurement type names like [\"BACK width\", \"Chest\", \"Length\"]',
    measurements_data JSON DEFAULT NULL COMMENT 'Object with measurement_type as key and size->value mapping as value',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES production_ready_products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

try {
    $db->exec($sql);
    echo json_encode([
        'success' => true,
        'message' => 'Table product_measurement_scales created successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error creating table: ' . $e->getMessage()
    ]);
}
?>