<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function optimizeResponse($success, $data = null, $error = null) {
    $response = ['success' => $success];
    if ($data) $response['data'] = $data;
    if ($error) $response['error'] = $error;
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        optimizeResponse(false, null, 'Method not allowed');
    }

    $database = new Database();
    $conn = $database->getConnection();

    if (!isset($_FILES['image']) || !isset($_POST['option_id'])) {
        optimizeResponse(false, null, 'Image and option ID are required');
    }

    $file = $_FILES['image'];
    $option_id = $_POST['option_id'];
    
    // Validate option exists
    $checkStmt = $conn->prepare("SELECT id FROM production_surmesure_optionfinition WHERE id = ?");
    $checkStmt->execute([$option_id]);
    if (!$checkStmt->fetch()) {
        optimizeResponse(false, null, 'Option/finition not found');
    }
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        optimizeResponse(false, null, 'Type de fichier non autorisé');
    }
    
    if ($file['size'] > $maxSize) {
        optimizeResponse(false, null, 'Fichier trop volumineux (max 5MB)');
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'option_finition_' . uniqid() . '_' . time() . '.' . $extension;
    $uploadPath = 'uploads/' . $filename;
    $fullUploadPath = __DIR__ . '/' . $uploadPath;
    
    // Ensure uploads directory exists
    $uploadDir = dirname($fullUploadPath);
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $fullUploadPath)) {
        optimizeResponse(false, null, 'Erreur lors du téléchargement');
    }
    
    // Update the option with the image URL
    $updateStmt = $conn->prepare("
        UPDATE production_surmesure_optionfinition 
        SET image_url = ?, updated_date = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $updateStmt->execute([$uploadPath, $option_id]);
    
    // Fetch updated option
    $fetchStmt = $conn->prepare("SELECT * FROM production_surmesure_optionfinition WHERE id = ?");
    $fetchStmt->execute([$option_id]);
    $option = $fetchStmt->fetch();
    
    // Return optimized response
    optimizeResponse(true, [
        'option' => $option,
        'image_url' => $uploadPath,
        'filename' => $filename,
        'size' => $file['size'],
        'type' => $file['type']
    ]);
    
} catch (Exception $e) {
    error_log("Option finition image upload error: " . $e->getMessage());
    optimizeResponse(false, null, 'Erreur serveur: ' . $e->getMessage());
}
?>