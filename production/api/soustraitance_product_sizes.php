<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => true
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                $productId = $_GET['product_id'];
                
                // Get current sizes configuration for the product
                $stmt = $pdo->prepare("
                    SELECT 
                        size_xs, size_s, size_m, size_l, size_xl, size_xxl, size_3xl, size_4xl,
                        size_30, size_31, size_32, size_33, size_34, size_36, size_38, size_39,
                        size_40, size_41, size_42, size_43, size_44, size_45, size_46, size_47, size_48,
                        size_50, size_52, size_54, size_56, size_58, size_60, size_62, size_64, size_66,
                        size_85, size_90, size_95, size_100, size_105, size_110, size_115, size_120, size_125
                    FROM production_soustraitance_products 
                    WHERE id = ?
                ");
                $stmt->execute([$productId]);
                $product = $stmt->fetch();
                
                if (!$product) {
                    throw new Exception('Product not found');
                }
                
                // Organize sizes by categories
                $sizes = [
                    'clothing' => [
                        'xs' => $product['size_xs'] == '1',
                        's' => $product['size_s'] == '1',
                        'm' => $product['size_m'] == '1',
                        'l' => $product['size_l'] == '1',
                        'xl' => $product['size_xl'] == '1',
                        'xxl' => $product['size_xxl'] == '1',
                        '3xl' => $product['size_3xl'] == '1',
                        '4xl' => $product['size_4xl'] == '1'
                    ],
                    'numeric_pants' => [
                        '30' => $product['size_30'] == '1',
                        '31' => $product['size_31'] == '1',
                        '32' => $product['size_32'] == '1',
                        '33' => $product['size_33'] == '1',
                        '34' => $product['size_34'] == '1',
                        '36' => $product['size_36'] == '1',
                        '38' => $product['size_38'] == '1',
                        '40' => $product['size_40'] == '1',
                        '42' => $product['size_42'] == '1',
                        '44' => $product['size_44'] == '1',
                        '46' => $product['size_46'] == '1',
                        '48' => $product['size_48'] == '1',
                        '50' => $product['size_50'] == '1',
                        '52' => $product['size_52'] == '1',
                        '54' => $product['size_54'] == '1',
                        '56' => $product['size_56'] == '1',
                        '58' => $product['size_58'] == '1',
                        '60' => $product['size_60'] == '1',
                        '62' => $product['size_62'] == '1',
                        '64' => $product['size_64'] == '1',
                        '66' => $product['size_66'] == '1'
                    ],
                    'shoes' => [
                        '39' => $product['size_39'] == '1',
                        '40' => $product['size_40'] == '1',
                        '41' => $product['size_41'] == '1',
                        '42' => $product['size_42'] == '1',
                        '43' => $product['size_43'] == '1',
                        '44' => $product['size_44'] == '1',
                        '45' => $product['size_45'] == '1',
                        '46' => $product['size_46'] == '1',
                        '47' => $product['size_47'] == '1'
                    ],
                    'belts' => [
                        '85' => $product['size_85'] == '1',
                        '90' => $product['size_90'] == '1',
                        '95' => $product['size_95'] == '1',
                        '100' => $product['size_100'] == '1',
                        '105' => $product['size_105'] == '1',
                        '110' => $product['size_110'] == '1',
                        '115' => $product['size_115'] == '1',
                        '120' => $product['size_120'] == '1',
                        '125' => $product['size_125'] == '1'
                    ]
                ];
                
                echo json_encode([
                    'success' => true,
                    'data' => $sizes
                ]);
            } else {
                throw new Exception('Product ID is required');
            }
            break;
        
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['product_id']) || !isset($input['sizes'])) {
                throw new Exception('Product ID and sizes data are required');
            }
            
            $productId = $input['product_id'];
            $sizes = $input['sizes'];
            
            // Build the update query
            $updateParts = [];
            $params = [];
            
            // Clothing sizes
            if (isset($sizes['clothing'])) {
                foreach ($sizes['clothing'] as $size => $enabled) {
                    $updateParts[] = "size_$size = ?";
                    $params[] = $enabled ? '1' : '0';
                }
            }
            
            // Numeric pants sizes
            if (isset($sizes['numeric_pants'])) {
                foreach ($sizes['numeric_pants'] as $size => $enabled) {
                    $updateParts[] = "size_$size = ?";
                    $params[] = $enabled ? '1' : '0';
                }
            }
            
            // Shoes sizes
            if (isset($sizes['shoes'])) {
                foreach ($sizes['shoes'] as $size => $enabled) {
                    $updateParts[] = "size_$size = ?";
                    $params[] = $enabled ? '1' : '0';
                }
            }
            
            // Belts sizes
            if (isset($sizes['belts'])) {
                foreach ($sizes['belts'] as $size => $enabled) {
                    $updateParts[] = "size_$size = ?";
                    $params[] = $enabled ? '1' : '0';
                }
            }
            
            if (empty($updateParts)) {
                throw new Exception('No sizes to update');
            }
            
            $params[] = $productId;
            
            $sql = "UPDATE production_soustraitance_products SET " . 
                   implode(', ', $updateParts) . 
                   " WHERE id = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Sizes updated successfully'
                ]);
            } else {
                throw new Exception('No changes were made or product not found');
            }
            break;
        
        default:
            throw new Exception('Method not allowed');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>