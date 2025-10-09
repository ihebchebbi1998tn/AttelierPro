<?php
require_once 'config.php';

function setupSoustraitanceStockTables($pdo) {
    try {
        // Read and execute the SQL file
        $sql = file_get_contents(__DIR__ . '/create_soustraitance_stock_table.sql');
        
        if ($sql === false) {
            throw new Exception('Could not read SQL file');
        }
        
        // Split SQL into individual statements
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        // Insert some default size configurations for existing products
        $pdo->exec("
            INSERT IGNORE INTO production_soustraitance_stock (product_id, size_name, stock_quantity, minimum_threshold, updated_by)
            SELECT 
                p.id,
                size_name,
                0 as stock_quantity,
                5 as minimum_threshold,
                'System' as updated_by
            FROM production_soustraitance_products p
            CROSS JOIN (
                SELECT 'XS' as size_name UNION ALL
                SELECT 'S' UNION ALL
                SELECT 'M' UNION ALL
                SELECT 'L' UNION ALL
                SELECT 'XL' UNION ALL
                SELECT 'XXL' UNION ALL
                SELECT '3XL' UNION ALL
                SELECT '4XL'
            ) sizes
            WHERE p.status_product = 'active'
        ");
        
        return ['success' => true, 'message' => 'Soustraitance stock tables created successfully'];
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error creating tables: ' . $e->getMessage()];
    }
}

// If called directly, execute setup
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    header('Content-Type: application/json');
    
    try {
        $database = new Database();
        $pdo = $database->getConnection();
        $result = setupSoustraitanceStockTables($pdo);
        echo json_encode($result);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database connection error: ' . $e->getMessage()]);
    }
}
?>