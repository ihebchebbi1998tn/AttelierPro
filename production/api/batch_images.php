<?php
require_once 'config.php';

// Enable error logging for debugging
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['batch_id'])) {
            // Get all images for a specific batch
            $stmt = $db->prepare("
                SELECT id, batch_id, image_path, original_filename, file_size, description, uploaded_by, created_at
                FROM productions_batches_images 
                WHERE batch_id = ?
                ORDER BY created_at ASC
            ");
            $stmt->execute([$_GET['batch_id']]);
            $images = $stmt->fetchAll();
            
            // Add full URLs for images
            foreach($images as &$image) {
                $image['full_url'] = 'https://luccibyey.com.tn/production/api/' . $image['image_path'];
                $image['file_path'] = $image['image_path']; // For compatibility
            }
            
            echo json_encode(['success' => true, 'data' => $images]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Batch ID required']);
        }
        break;

    case 'POST':
        // Handle image upload for batch
        if (!isset($_FILES['image']) || !isset($_POST['batch_id'])) {
            echo json_encode(['success' => false, 'message' => 'Image and batch ID are required']);
            exit;
        }

        $batch_id = $_POST['batch_id'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $uploaded_by = isset($_POST['uploaded_by']) ? $_POST['uploaded_by'] : 'system';
        
        $file = $_FILES['image'];
        $upload_dir = 'uploads/batch_images/';
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'Only JPEG, PNG, and WEBP images are allowed']);
            exit;
        }
        
        // Validate file size (5MB max)
        if ($file['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size must be less than 5MB']);
            exit;
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'batch_' . $batch_id . '_' . uniqid() . '_' . time() . '.' . $file_extension;
        $file_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $file_path)) {
            try {
                // Create table if it doesn't exist
                $db->exec("CREATE TABLE IF NOT EXISTS `productions_batches_images` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `batch_id` INT NOT NULL,
                    `image_path` VARCHAR(500) NOT NULL,
                    `original_filename` VARCHAR(255) NOT NULL,
                    `file_size` INT,
                    `description` TEXT,
                    `uploaded_by` VARCHAR(100),
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_batch_id` (`batch_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

                // Save to productions_batches_images table
                $stmt = $db->prepare("
                    INSERT INTO productions_batches_images 
                    (batch_id, image_path, original_filename, file_size, description, uploaded_by, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                ");
                
                $result = $stmt->execute([
                    $batch_id,
                    $file_path,
                    $file['name'],
                    $file['size'],
                    $description,
                    $uploaded_by
                ]);
                
                if($result) {
                    $image_id = $db->lastInsertId();
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Image uploaded successfully',
                        'image_id' => $image_id,
                        'file_path' => $file_path,
                        'full_url' => 'https://luccibyey.com.tn/production/api/' . $file_path
                    ]);
                } else {
                    // Delete uploaded file if database insert failed
                    unlink($file_path);
                    $errorInfo = $stmt->errorInfo();
                    echo json_encode(['success' => false, 'message' => 'Database error: ' . $errorInfo[2]]);
                }
            } catch (Exception $e) {
                // Delete uploaded file if any error occurred
                unlink($file_path);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Error uploading file: ' . error_get_last()['message']]);
        }
        break;

    case 'DELETE':
        // Delete batch image
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['image_id'])) {
            echo json_encode(['success' => false, 'message' => 'Image ID required']);
            exit;
        }
        
        // Get file path before deleting from database
        $stmt = $db->prepare("SELECT image_path FROM productions_batches_images WHERE id = ?");
        $stmt->execute([$input['image_id']]);
        $image = $stmt->fetch();
        
        if ($image) {
            // Delete from database
            $stmt = $db->prepare("DELETE FROM productions_batches_images WHERE id = ?");
            $result = $stmt->execute([$input['image_id']]);
            
            if ($result) {
                // Delete physical file
                if (file_exists($image['image_path'])) {
                    unlink($image['image_path']);
                }
                echo json_encode(['success' => true, 'message' => 'Image deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error deleting image']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Image not found']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>