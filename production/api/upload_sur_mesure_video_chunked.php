<?php
require_once 'config.php';

// Set limits for large file handling
ini_set('upload_max_filesize', '200M');
ini_set('post_max_size', '200M');
ini_set('memory_limit', '512M');
ini_set('max_execution_time', '3600');
ini_set('max_input_time', '3600');

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

    // Create necessary directories
    $chunkDir = __DIR__ . "/chunks";
    $videoDir = __DIR__ . "/uploads";
    
    if (!is_dir($chunkDir)) mkdir($chunkDir, 0755, true);
    if (!is_dir($videoDir)) mkdir($videoDir, 0755, true);

    // Check if chunk is uploaded
    if (!isset($_FILES['chunk'])) {
        optimizeResponse(false, null, 'No chunk uploaded');
    }

    // Get upload parameters
    $originalFilename = $_POST['originalFilename'] ?? 'video';
    $chunkIndex = intval($_POST['chunkIndex'] ?? 0);
    $totalChunks = intval($_POST['totalChunks'] ?? 1);
    $commandeId = intval($_POST['commande_id'] ?? 0);
    $commentaire = $_POST['commentaire'] ?? null;
    
    if ($commandeId <= 0) {
        optimizeResponse(false, null, 'Order ID is required');
    }

    // Verify order exists
    $checkQuery = "SELECT id FROM production_surmesure_commandes WHERE id = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$commandeId]);
    if (!$checkStmt->fetch()) {
        optimizeResponse(false, null, 'Order not found');
    }

    // Generate unique filename for this upload session
    $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
    $uniqueFilename = 'surmesure_video_' . $commandeId . '_' . uniqid() . '_' . time() . '.' . $extension;
    
    // Save chunk
    $chunkPath = "$chunkDir/{$uniqueFilename}.part{$chunkIndex}";
    if (!move_uploaded_file($_FILES['chunk']['tmp_name'], $chunkPath)) {
        optimizeResponse(false, null, 'Failed to save chunk ' . $chunkIndex);
    }

    // If not the last chunk, just respond with success
    if ($chunkIndex + 1 < $totalChunks) {
        optimizeResponse(true, [
            'chunkIndex' => $chunkIndex,
            'totalChunks' => $totalChunks,
            'message' => "Chunk $chunkIndex uploaded successfully"
        ]);
    }

    // Last chunk - merge all chunks
    $finalVideoPath = "uploads/" . $uniqueFilename;
    $mergedPath = __DIR__ . "/" . $finalVideoPath;
    
    $out = fopen($mergedPath, "wb");
    if (!$out) {
        optimizeResponse(false, null, 'Failed to create final video file');
    }

    $totalSize = 0;
    
    // Merge all chunks in order
    for ($i = 0; $i < $totalChunks; $i++) {
        $partPath = "$chunkDir/{$uniqueFilename}.part{$i}";
        
        if (!file_exists($partPath)) {
            fclose($out);
            if (file_exists($mergedPath)) unlink($mergedPath);
            optimizeResponse(false, null, "Missing chunk $i, cannot merge video");
        }
        
        $in = fopen($partPath, "rb");
        if ($in) {
            $chunkSize = stream_copy_to_stream($in, $out);
            $totalSize += $chunkSize;
            fclose($in);
            unlink($partPath); // Clean up chunk after merge
        }
    }
    
    fclose($out);

    // Validate merged file
    if (!file_exists($mergedPath) || filesize($mergedPath) === 0) {
        if (file_exists($mergedPath)) unlink($mergedPath);
        optimizeResponse(false, null, 'Video merge failed or resulted in empty file');
    }

    // Validate video file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $mergedPath);
    finfo_close($finfo);
    
    $allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/quicktime'];
    if (!in_array($mimeType, $allowedTypes)) {
        unlink($mergedPath);
        optimizeResponse(false, null, 'Invalid video file type: ' . $mimeType);
    }

    // Save to database
    $insertQuery = "INSERT INTO production_surmesure_videos (commande_id, video_path, commentaire, file_size, mime_type) VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    
    if ($insertStmt->execute([$commandeId, $finalVideoPath, $commentaire, $totalSize, $mimeType])) {
        $videoId = $db->lastInsertId();
        
        // Return success response
        optimizeResponse(true, [
            'id' => $videoId,
            'commande_id' => $commandeId,
            'video_path' => $finalVideoPath,
            'commentaire' => $commentaire,
            'filename' => $uniqueFilename,
            'url' => "https://luccibyey.com.tn/api/" . $finalVideoPath,
            'file_size' => $totalSize,
            'mime_type' => $mimeType,
            'message' => 'Video uploaded and merged successfully'
        ]);
    } else {
        // Clean up merged file on database error
        if (file_exists($mergedPath)) {
            unlink($mergedPath);
        }
        optimizeResponse(false, null, 'Failed to save video information to database');
    }
    
} catch (Exception $e) {
    error_log("Sur mesure chunked video upload error: " . $e->getMessage());
    
    // Clean up any partial files
    if (isset($mergedPath) && file_exists($mergedPath)) {
        unlink($mergedPath);
    }
    
    // Clean up any remaining chunks
    if (isset($uniqueFilename) && isset($totalChunks)) {
        for ($i = 0; $i < $totalChunks; $i++) {
            $partPath = "$chunkDir/{$uniqueFilename}.part{$i}";
            if (file_exists($partPath)) {
                unlink($partPath);
            }
        }
    }
    
    optimizeResponse(false, null, 'Server error during video upload');
}
?>