<?php
// Initialize product sizes API
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

// Function to initialize sizes for a product
function initProductSizes($db, $product_id) {
    $size_categories = [
        'clothing' => ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'],
        'numeric_pants' => ['30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66'],
        'shoes' => ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
        'belts' => ['85', '90', '95', '100', '105', '110', '115', '120', '125']
    ];
    
    $db->beginTransaction();
    
    try {
        foreach ($size_categories as $size_type => $sizes) {
            foreach ($sizes as $size_value) {
                $query = "INSERT IGNORE INTO product_sizes_config (product_id, size_type, size_value, is_active) 
                         VALUES (:product_id, :size_type, :size_value, 0)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':product_id', $product_id);
                $stmt->bindParam(':size_type', $size_type);
                $stmt->bindParam(':size_value', $size_value);
                $stmt->execute();
            }
        }
        
        $db->commit();
        return true;
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['product_id'])) {
            $product_id = $input['product_id'];
            
            // Check if product exists
            $query = "SELECT id FROM production_ready_products WHERE id = :product_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':product_id', $product_id);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                throw new Exception('Product not found');
            }
            
            initProductSizes($db, $product_id);
            
            echo json_encode([
                'success' => true,
                'message' => 'Size configuration initialized for product'
            ]);
        } else if (isset($input['init_all'])) {
            // Initialize sizes for all products that don't have size config yet
            $query = "SELECT DISTINCT p.id 
                     FROM production_ready_products p 
                     LEFT JOIN product_sizes_config psc ON p.id = psc.product_id 
                     WHERE psc.product_id IS NULL";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $products = $stmt->fetchAll();
            
            foreach ($products as $product) {
                initProductSizes($db, $product['id']);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Size configurations initialized for ' . count($products) . ' products'
            ]);
        } else {
            throw new Exception('Product ID is required');
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>