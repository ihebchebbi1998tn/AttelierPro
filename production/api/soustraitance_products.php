<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function optimizeResponse($success, $data = null, $error = null) {
    $response = ['success' => $success];
    if ($data) $response['data'] = $data;
    if ($error) $response['error'] = $error;
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    // Ensure MySQL allows binding or emulate prepares for LIMIT/OFFSET
    $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single product
                $productId = (int)$_GET['id'];
                $query = "SELECT sp.*, sc.name as client_name 
                         FROM production_soustraitance_products sp 
                         LEFT JOIN production_soustraitance_clients sc ON sp.client_id = sc.id 
                         WHERE sp.id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$productId]);
                $product = $stmt->fetch();
                
                if ($product) {
                    optimizeResponse(true, $product);
                } else {
                    optimizeResponse(false, null, 'Product not found');
                }
            } else {
                // Get all products with pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                // Clamp limit to a reasonable range and compute offset safely
                $limit = max(1, min(100, (int)$limit));
                $offset = max(0, (int)(($page - 1) * $limit));
                $clientId = isset($_GET['client_id']) ? (int)$_GET['client_id'] : null;
                
                $whereClause = $clientId ? "WHERE sp.client_id = ?" : "";
                $params = $clientId ? [$clientId] : [];
                
                // Inline LIMIT/OFFSET to avoid MySQL PDO binding issues
                $query = "SELECT sp.*, sc.name as client_name 
                         FROM production_soustraitance_products sp 
                         LEFT JOIN production_soustraitance_clients sc ON sp.client_id = sc.id 
                         $whereClause
                         ORDER BY sp.created_at DESC 
                         LIMIT $limit OFFSET $offset";
                
                $stmt = $db->prepare($query);
                $stmt->execute($params);
                $products = $stmt->fetchAll();
                
                // Get total count
                $countQuery = "SELECT COUNT(*) as total FROM production_soustraitance_products sp $whereClause";
                $countParams = $clientId ? [$clientId] : [];
                $countStmt = $db->prepare($countQuery);
                $countStmt->execute($countParams);
                $total = $countStmt->fetch()['total'];
                
                optimizeResponse(true, [
                    'products' => $products,
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit
                ]);
            }
            break;
            
        case 'POST':
            // Create new product with image uploads
            
            // Check if we have both form data and files
            $hasFiles = !empty($_FILES);
            $input = [];
            
            if ($hasFiles) {
                // Handle multipart form data
                $input = $_POST;
            } else {
                // Handle JSON data
                $input = json_decode(file_get_contents('php://input'), true);
            }
            
            if (!isset($input['client_id']) || !isset($input['nom_product'])) {
                optimizeResponse(false, null, 'Client ID and product name are required');
            }
            
            $fields = [
                'client_id', 'reference_product', 'nom_product', 'description_product',
                'type_product', 'category_product', 'itemgroup_product', 'price_product',
                'qnty_product', 'color_product', 'collection_product', 'status_product',
                'auto_replenishment', 'auto_replenishment_quantity', 'discount_product',
                'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
                'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
                'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
                'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
                'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
                'size_115', 'size_120', 'size_125', 'no_size'
            ];
            
            // Handle no_size mutual exclusion logic
            if (isset($input['no_size']) && $input['no_size'] == 1) {
                // If no_size is checked, uncheck all other sizes
                $sizeFields = [
                    'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
                    'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
                    'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
                    'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
                    'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
                    'size_115', 'size_120', 'size_125'
                ];
                foreach ($sizeFields as $sizeField) {
                    $input[$sizeField] = 0;
                }
            } else {
                // If any size is checked, uncheck no_size
                $sizeFields = [
                    'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
                    'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
                    'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
                    'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
                    'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
                    'size_115', 'size_120', 'size_125'
                ];
                $hasSizeChecked = false;
                foreach ($sizeFields as $sizeField) {
                    if (isset($input[$sizeField]) && $input[$sizeField] == 1) {
                        $hasSizeChecked = true;
                        break;
                    }
                }
                if ($hasSizeChecked) {
                    $input['no_size'] = 0;
                }
            }
            
            // Handle image uploads if files are present
            $uploadedImages = [];
            if ($hasFiles) {
                $upload_dir = 'uploads/soustraitance_products/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                
                $imageSlots = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
                $imageIndex = 0;
                
                foreach ($_FILES as $fileKey => $file) {
                    if ($file['error'] === UPLOAD_ERR_OK && $imageIndex < 5) {
                        // Validate file type
                        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                        if (!in_array($file['type'], $allowed_types)) {
                            continue; // Skip invalid files
                        }
                        
                        // Validate file size (10MB max)
                        if ($file['size'] > 10 * 1024 * 1024) {
                            continue; // Skip large files
                        }
                        
                        // Generate unique filename
                        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                        $filename = 'soustraitance_product_' . uniqid() . '_' . time() . '.' . $file_extension;
                        $file_path = $upload_dir . $filename;
                        
                        if (move_uploaded_file($file['tmp_name'], $file_path)) {
                            $uploadedImages[$imageSlots[$imageIndex]] = $file_path;
                            $imageIndex++;
                        }
                    }
                }
                
                // Add image fields to the insert
                foreach ($imageSlots as $slot) {
                    if (isset($uploadedImages[$slot])) {
                        $fields[] = $slot;
                    }
                }
            }
            
            $values = [];
            $placeholders = [];
            
            foreach ($fields as $field) {
                if (isset($uploadedImages[$field])) {
                    $values[] = $uploadedImages[$field];
                } else {
                    $values[] = $input[$field] ?? null;
                }
                $placeholders[] = '?';
            }
            
            $query = "INSERT INTO production_soustraitance_products (" . implode(', ', $fields) . ") 
                     VALUES (" . implode(', ', $placeholders) . ")";
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($values)) {
                $productId = $db->lastInsertId();
                optimizeResponse(true, [
                    'id' => $productId, 
                    'product_id' => $productId,
                    'message' => 'Product created successfully',
                    'uploaded_images' => count($uploadedImages)
                ]);
            } else {
                // Clean up uploaded files if database insert failed
                foreach ($uploadedImages as $imagePath) {
                    if (file_exists($imagePath)) {
                        unlink($imagePath);
                    }
                }
                optimizeResponse(false, null, 'Failed to create product');
            }
            break;
            
        case 'PUT':
            // Update product
            if (!isset($_GET['id'])) {
                optimizeResponse(false, null, 'Product ID is required');
            }
            
            $productId = (int)$_GET['id'];
            $input = json_decode(file_get_contents('php://input'), true);
            
            $fields = [
                'client_id', 'reference_product', 'nom_product', 'description_product',
                'type_product', 'category_product', 'itemgroup_product', 'price_product',
                'qnty_product', 'color_product', 'collection_product', 'status_product',
                'auto_replenishment', 'auto_replenishment_quantity', 'discount_product',
                'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
                'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
                'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
                'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
                'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
                'size_115', 'size_120', 'size_125', 'no_size'
            ];
            
            // Handle no_size mutual exclusion logic
            if (isset($input['no_size']) && $input['no_size'] == 1) {
                // If no_size is checked, uncheck all other sizes
                $sizeFields = [
                    'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
                    'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
                    'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
                    'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
                    'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
                    'size_115', 'size_120', 'size_125'
                ];
                foreach ($sizeFields as $sizeField) {
                    $input[$sizeField] = 0;
                }
            } else {
                // If any size is checked, uncheck no_size
                $sizeFields = [
                    'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
                    'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
                    'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
                    'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
                    'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
                    'size_115', 'size_120', 'size_125'
                ];
                $hasSizeChecked = false;
                foreach ($sizeFields as $sizeField) {
                    if (isset($input[$sizeField]) && $input[$sizeField] == 1) {
                        $hasSizeChecked = true;
                        break;
                    }
                }
                if ($hasSizeChecked) {
                    $input['no_size'] = 0;
                }
            }
            
            $setParts = [];
            $values = [];
            
            foreach ($fields as $field) {
                if (isset($input[$field])) {
                    $setParts[] = "$field = ?";
                    $values[] = $input[$field];
                }
            }
            
            if (empty($setParts)) {
                optimizeResponse(false, null, 'No fields to update');
            }
            
            $values[] = $productId;
            
            $query = "UPDATE production_soustraitance_products SET " . implode(', ', $setParts) . 
                    ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($values)) {
                optimizeResponse(true, ['message' => 'Product updated successfully']);
            } else {
                optimizeResponse(false, null, 'Failed to update product');
            }
            break;
            
        case 'DELETE':
            // Delete product
            if (!isset($_GET['id'])) {
                optimizeResponse(false, null, 'Product ID is required');
            }
            
            $productId = (int)$_GET['id'];
            
            // First get product images to delete files
            $query = "SELECT img_product, img2_product, img3_product, img4_product, img5_product 
                     FROM production_soustraitance_products WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            if ($product) {
                // Delete image files
                $imageFields = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
                foreach ($imageFields as $field) {
                    if ($product[$field] && file_exists($product[$field])) {
                        unlink($product[$field]);
                    }
                }
                
                // Delete product record
                $deleteQuery = "DELETE FROM production_soustraitance_products WHERE id = ?";
                $deleteStmt = $db->prepare($deleteQuery);
                
                if ($deleteStmt->execute([$productId])) {
                    optimizeResponse(true, ['message' => 'Product deleted successfully']);
                } else {
                    optimizeResponse(false, null, 'Failed to delete product');
                }
            } else {
                optimizeResponse(false, null, 'Product not found');
            }
            break;
            
        default:
            optimizeResponse(false, null, 'Method not allowed');
    }
    
} catch (Exception $e) {
    error_log("Soustraitance products API error: " . $e->getMessage());
    optimizeResponse(false, null, 'Server error');
}
?>