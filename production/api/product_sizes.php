<?php
// Product sizes configuration API
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                $product_id = $_GET['product_id'];
                
                // Check if product has no sizes
                $no_sizes_query = "SELECT COUNT(*) as no_sizes_count FROM product_sizes_config WHERE product_id = :product_id AND size_type = 'no_sizes'";
                $no_sizes_stmt = $db->prepare($no_sizes_query);
                $no_sizes_stmt->bindParam(':product_id', $product_id);
                $no_sizes_stmt->execute();
                $no_sizes_result = $no_sizes_stmt->fetch();
                
                $has_no_sizes = $no_sizes_result['no_sizes_count'] > 0;
                
                if ($has_no_sizes) {
                    echo json_encode([
                        'success' => true,
                        'data' => [],
                        'no_sizes' => true
                    ]);
                } else {
                    $query = "SELECT * FROM product_sizes_config WHERE product_id = :product_id AND size_type != 'no_sizes' ORDER BY size_type, size_value";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':product_id', $product_id);
                    $stmt->execute();
                    
                    $sizes = $stmt->fetchAll();
                    
                    // Group sizes by type
                    $grouped_sizes = [];
                    foreach ($sizes as $size) {
                        $grouped_sizes[$size['size_type']][] = $size;
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'data' => $grouped_sizes,
                        'no_sizes' => false
                    ]);
                }
            } else {
                // Get all size configurations
                $query = "SELECT * FROM product_sizes_config ORDER BY product_id, size_type, size_value";
                $stmt = $db->prepare($query);
                $stmt->execute();
                
                $sizes = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'data' => $sizes
                ]);
            }
            break;

        case 'POST':
            // Create size configurations for a product
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['product_id']) || !isset($input['sizes'])) {
                throw new Exception('Product ID and sizes are required');
            }
            
            $product_id = $input['product_id'];
            $sizes = $input['sizes'];
            
            $db->beginTransaction();
            
            // First, deactivate all sizes for this product
            $query = "UPDATE product_sizes_config SET is_active = 0 WHERE product_id = :product_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':product_id', $product_id);
            $stmt->execute();
            
            // Then activate or insert the selected sizes
            foreach ($sizes as $size_type => $size_values) {
                foreach ($size_values as $size_value) {
                    $query = "INSERT INTO product_sizes_config (product_id, size_type, size_value, is_active) 
                             VALUES (:product_id, :size_type, :size_value, 1)
                             ON DUPLICATE KEY UPDATE is_active = 1";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':product_id', $product_id);
                    $stmt->bindParam(':size_type', $size_type);
                    $stmt->bindParam(':size_value', $size_value);
                    $stmt->execute();
                }
            }
            
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Size configuration saved successfully'
            ]);
            break;

        case 'PUT':
            // Update size configuration
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['product_id'])) {
                throw new Exception('Product ID is required');
            }
            
            $product_id = $input['product_id'];
            
            $db->beginTransaction();
            
            // Delete all existing size configurations for this product
            $query = "DELETE FROM product_sizes_config WHERE product_id = :product_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':product_id', $product_id);
            $stmt->execute();
            
            if (isset($input['no_sizes']) && $input['no_sizes'] === true) {
                // Product has no sizes - insert a special marker
                $query = "INSERT INTO product_sizes_config (product_id, size_type, size_value, is_active) 
                         VALUES (:product_id, 'no_sizes', 'none', 1)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->execute();
            } else if (isset($input['sizes'])) {
                // Product has sizes - insert selected sizes
                $sizes = $input['sizes'];
                foreach ($sizes as $size_type => $size_values) {
                    foreach ($size_values as $size_value) {
                        $query = "INSERT INTO product_sizes_config (product_id, size_type, size_value, is_active) 
                                 VALUES (:product_id, :size_type, :size_value, 1)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':product_id', $product_id);
                        $stmt->bindParam(':size_type', $size_type);
                        $stmt->bindParam(':size_value', $size_value);
                        $stmt->execute();
                    }
                }
            }
            
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Size configuration updated successfully'
            ]);
            break;

        case 'DELETE':
            if (isset($_GET['product_id'])) {
                $product_id = $_GET['product_id'];
                
                $query = "DELETE FROM product_sizes_config WHERE product_id = :product_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Size configuration deleted successfully'
                ]);
            } else if (isset($_GET['id'])) {
                $id = $_GET['id'];
                
                $query = "DELETE FROM product_sizes_config WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Size deleted successfully'
                ]);
            } else {
                throw new Exception('Product ID or Size ID is required');
            }
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollback();
    }
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>