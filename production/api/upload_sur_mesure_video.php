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

    if (!isset($_FILES['video'])) {
        optimizeResponse(false, null, 'No video uploaded');
    }

    if (!isset($_POST['commande_id'])) {
        optimizeResponse(false, null, 'Order ID is required');
    }

    $commandeId = (int)$_POST['commande_id'];
    $commentaire = $_POST['commentaire'] ?? null;
    $file = $_FILES['video'];
    
    // Validate file
    $allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    $maxSize = 50 * 1024 * 1024; // 50MB for videos
    
    if (!in_array($file['type'], $allowedTypes)) {
        optimizeResponse(false, null, 'Type de fichier non autorisé. Utilisez MP4, AVI, MOV, WMV ou WebM.');
    }
    
    if ($file['size'] > $maxSize) {
        optimizeResponse(false, null, 'Fichier trop volumineux (max 50MB)');
    }

    // Verify order exists
    $checkQuery = "SELECT id FROM production_surmesure_commandes WHERE id = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$commandeId]);
    if (!$checkStmt->fetch()) {
        optimizeResponse(false, null, 'Order not found');
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'surmesure_video_' . $commandeId . '_' . uniqid() . '_' . time() . '.' . $extension;
    $uploadPath = 'uploads/' . $filename;
    
    // Ensure uploads directory exists
    $uploadDir = dirname($uploadPath);
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        optimizeResponse(false, null, 'Erreur lors du téléchargement');
    }

    // Save to database
    $insertQuery = "INSERT INTO production_surmesure_videos (commande_id, video_path, commentaire) VALUES (?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    
    if ($insertStmt->execute([$commandeId, $uploadPath, $commentaire])) {
        $videoId = $db->lastInsertId();
        
        // Return optimized response
        optimizeResponse(true, [
            'id' => $videoId,
            'commande_id' => $commandeId,
            'video_path' => $uploadPath,
            'commentaire' => $commentaire,
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
    error_log("Sur mesure video upload error: " . $e->getMessage());
    
    // Clean up uploaded file on error
    if (isset($uploadPath) && file_exists($uploadPath)) {
        unlink($uploadPath);
    }
    
    optimizeResponse(false, null, 'Erreur serveur');
}
?>