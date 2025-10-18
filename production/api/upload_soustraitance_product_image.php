<?php
require_once 'config.php';

// Enable error logging for debugging
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

function optimizeResponse($success, $data = null, $error = null) {
    $response = ['success' => $success];
    if ($data) $response['data'] = $data;
    if ($error) $response['error'] = $error;
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

switch($method) {
    case 'POST':
        // Handle image upload for soustraitance product
        if (!isset($_FILES['image'])) {
            optimizeResponse(false, null, 'Image is required');
        }

        $product_id = $_POST['product_id'] ?? null;
        $temp_upload = $_POST['temp_upload'] ?? false; // For temporary uploads before product creation
        $file = $_FILES['image'];
        $upload_dir = 'uploads/soustraitance_products/';
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Validate file type (images only)
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            optimizeResponse(false, null, 'Seuls les fichiers image sont autorisés (JPEG, PNG, GIF, WebP)');
        }
        
        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            optimizeResponse(false, null, 'Le fichier doit faire moins de 10MB');
        }

        if ($temp_upload) {
            // Handle temporary upload (before product creation)
            $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'temp_soustraitance_' . uniqid() . '_' . time() . '.' . $file_extension;
            $file_path = $upload_dir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $file_path)) {
                optimizeResponse(true, [
                    'temp_upload' => true,
                    'file_path' => $file_path,
                    'full_url' => 'https://luccibyey.com.tn/production/api/' . $file_path,
                    'filename' => $filename,
                    'size' => $file['size'],
                    'type' => $file['type']
                ]);
            } else {
                optimizeResponse(false, null, 'Erreur lors du téléchargement du fichier');
            }
        } else {
            // Handle normal upload (with product_id)
            if (!$product_id) {
                optimizeResponse(false, null, 'Product ID is required for permanent upload');
            }
        
        // Verify product exists
        $checkStmt = $db->prepare("SELECT id, img_product, img2_product, img3_product, img4_product, img5_product FROM production_soustraitance_products WHERE id = ?");
        $checkStmt->execute([$product_id]);
        $product = $checkStmt->fetch();
        
        if (!$product) {
            optimizeResponse(false, null, 'Produit non trouvé');
        }
        
        // Find next available image slot
        $imageSlots = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
        $nextSlot = null;
        
        foreach ($imageSlots as $slot) {
            if (empty($product[$slot])) {
                $nextSlot = $slot;
                break;
            }
        }
        
        if (!$nextSlot) {
            optimizeResponse(false, null, 'Ce produit a déjà 5 images. Supprimez une image pour en ajouter une nouvelle.');
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'soustraitance_product_' . $product_id . '_' . $nextSlot . '_' . uniqid() . '_' . time() . '.' . $file_extension;
        $file_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $file_path)) {
            try {
                // Update database with new image path
                $updateStmt = $db->prepare("UPDATE production_soustraitance_products SET {$nextSlot} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $result = $updateStmt->execute([$file_path, $product_id]);
                
                if($result) {
                    optimizeResponse(true, [
                        'product_id' => $product_id,
                        'image_slot' => $nextSlot,
                        'file_path' => $file_path,
                        'full_url' => 'https://luccibyey.com.tn/production/api/' . $file_path,
                        'filename' => $filename,
                        'size' => $file['size'],
                        'type' => $file['type']
                    ]);
                } else {
                    // Delete uploaded file if database update failed
                    unlink($file_path);
                    optimizeResponse(false, null, 'Erreur lors de la sauvegarde en base de données');
                }
            } catch (Exception $e) {
                // Delete uploaded file if any error occurred
                unlink($file_path);
                optimizeResponse(false, null, 'Erreur de base de données: ' . $e->getMessage());
            }
        } else {
            optimizeResponse(false, null, 'Erreur lors du téléchargement du fichier');
        }
        }
        break;

    case 'PUT':
        // Assign temporary images to product after creation
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['product_id']) || !isset($input['temp_images'])) {
            optimizeResponse(false, null, 'Product ID and temp_images array are required');
        }
        
        $product_id = $input['product_id'];
        $temp_images = $input['temp_images']; // Array of temporary file paths
        
        // Verify product exists
        $checkStmt = $db->prepare("SELECT id FROM production_soustraitance_products WHERE id = ?");
        $checkStmt->execute([$product_id]);
        if (!$checkStmt->fetch()) {
            optimizeResponse(false, null, 'Produit non trouvé');
        }
        
        try {
            $imageSlots = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
            $updateFields = [];
            $updateValues = [];
            
            foreach ($temp_images as $index => $temp_path) {
                if ($index < 5 && file_exists($temp_path)) {
                    $slot = $imageSlots[$index];
                    $updateFields[] = "{$slot} = ?";
                    $updateValues[] = $temp_path;
                }
            }
            
            if (!empty($updateFields)) {
                $updateValues[] = $product_id;
                $sql = "UPDATE production_soustraitance_products SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                $updateStmt = $db->prepare($sql);
                $result = $updateStmt->execute($updateValues);
                
                if ($result) {
                    optimizeResponse(true, [
                        'product_id' => $product_id,
                        'assigned_images' => count($updateFields),
                        'message' => 'Images assignées avec succès au produit'
                    ]);
                } else {
                    optimizeResponse(false, null, 'Erreur lors de l\'assignation des images');
                }
            } else {
                optimizeResponse(false, null, 'Aucune image temporaire valide trouvée');
            }
        } catch (Exception $e) {
            optimizeResponse(false, null, 'Erreur: ' . $e->getMessage());
        }
        break;
        break;

    case 'DELETE':
        // Delete specific image from product
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['product_id']) || !isset($input['image_slot'])) {
            optimizeResponse(false, null, 'Product ID and image slot are required');
        }
        
        $product_id = $input['product_id'];
        $image_slot = $input['image_slot'];
        
        // Validate image slot
        $validSlots = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
        if (!in_array($image_slot, $validSlots)) {
            optimizeResponse(false, null, 'Invalid image slot');
        }
        
        // Get current image path
        $stmt = $db->prepare("SELECT {$image_slot} FROM production_soustraitance_products WHERE id = ?");
        $stmt->execute([$product_id]);
        $product = $stmt->fetch();
        
        if ($product && !empty($product[$image_slot])) {
            // Update database to remove image
            $updateStmt = $db->prepare("UPDATE production_soustraitance_products SET {$image_slot} = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $result = $updateStmt->execute([$product_id]);
            
            if ($result) {
                // Delete physical file
                $imagePath = $product[$image_slot];
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
                optimizeResponse(true, ['message' => 'Image supprimée avec succès']);
            } else {
                optimizeResponse(false, null, 'Erreur lors de la suppression en base');
            }
        } else {
            optimizeResponse(false, null, 'Image non trouvée');
        }
        break;

    default:
        optimizeResponse(false, null, 'Method not allowed');
        break;
}
?>