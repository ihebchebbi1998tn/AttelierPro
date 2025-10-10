<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        optimizeResponse(false, null, 'Method not allowed');
    }

    if (!isset($_FILES['image'])) {
        optimizeResponse(false, null, 'No image uploaded');
    }

    if (!isset($_POST['product_id'])) {
        optimizeResponse(false, null, 'Product ID is required');
    }

    $productId = (int)$_POST['product_id'];
    $imageSlot = $_POST['image_slot'] ?? 'img_product'; // img_product, img2_product, etc.
    $file = $_FILES['image'];
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        optimizeResponse(false, null, 'Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP.');
    }
    
    if ($file['size'] > $maxSize) {
        optimizeResponse(false, null, 'Fichier trop volumineux (max 10MB)');
    }

    // Verify product exists
    $checkQuery = "SELECT id FROM production_soustraitance_products WHERE id = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$productId]);
    if (!$checkStmt->fetch()) {
        optimizeResponse(false, null, 'Product not found');
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'soustraitance_product_' . $productId . '_' . $imageSlot . '_' . uniqid() . '_' . time() . '.' . $extension;
    $uploadPath = 'uploads/soustraitance_products/' . $filename;
    
    // Ensure uploads directory exists
    $uploadDir = dirname($uploadPath);
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Get current image path to delete old file
    $getCurrentQuery = "SELECT $imageSlot FROM production_soustraitance_products WHERE id = ?";
    $getCurrentStmt = $db->prepare($getCurrentQuery);
    $getCurrentStmt->execute([$productId]);
    $currentData = $getCurrentStmt->fetch();
    $oldImagePath = $currentData[$imageSlot] ?? null;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        optimizeResponse(false, null, 'Erreur lors du téléchargement');
    }

    // Update database
    $updateQuery = "UPDATE production_soustraitance_products SET $imageSlot = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    $updateStmt = $db->prepare($updateQuery);
    
    if ($updateStmt->execute([$uploadPath, $productId])) {
        // Delete old image file
        if ($oldImagePath && file_exists($oldImagePath)) {
            unlink($oldImagePath);
        }
        
        // Return optimized response
        optimizeResponse(true, [
            'product_id' => $productId,
            'image_slot' => $imageSlot,
            'image_path' => $uploadPath,
            'filename' => $filename,
            'url' => $uploadPath,
            'size' => $file['size'],
            'type' => $file['type']
        ]);
    } else {
        // Clean up uploaded file on database error
        if (file_exists($uploadPath)) {
            unlink($uploadPath);
        }
        optimizeResponse(false, null, 'Erreur lors de la sauvegarde en base');
    }
    
} catch (Exception $e) {
    error_log("Soustraitance product image upload error: " . $e->getMessage());
    
    // Clean up uploaded file on error
    if (isset($uploadPath) && file_exists($uploadPath)) {
        unlink($uploadPath);
    }
    
    optimizeResponse(false, null, 'Erreur serveur');
}
?>