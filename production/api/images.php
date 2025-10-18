<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['related_type']) && isset($_GET['related_id'])) {
            // Get images for specific related item
            $stmt = $db->prepare("
                SELECT image_id, related_type, related_id, file_path, uploaded_user, upload_date 
                FROM production_images 
                WHERE related_type = ? AND related_id = ? 
                ORDER BY upload_date ASC
            ");
            $stmt->execute([$_GET['related_type'], $_GET['related_id']]);
            $images = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $images]);
            
        } elseif(isset($_GET['image_id'])) {
            // Get specific image
            $stmt = $db->prepare("
                SELECT image_id, related_type, related_id, file_path, uploaded_user, upload_date 
                FROM production_images 
                WHERE image_id = ?
            ");
            $stmt->execute([$_GET['image_id']]);
            $image = $stmt->fetch();
            
            if ($image) {
                echo json_encode(['success' => true, 'data' => $image]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Image not found']);
            }
            
        } else {
            // Get all images
            $stmt = $db->query("
                SELECT image_id, related_type, related_id, file_path, uploaded_user, upload_date 
                FROM production_images 
                ORDER BY upload_date DESC
            ");
            $images = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $images]);
        }
        break;

    case 'DELETE':
        // Delete image
        try {
            $imageId = $_GET['image_id'] ?? null;
            
            if (!$imageId) {
                throw new Exception('image_id is required');
            }
            
            // Get image info before deletion
            $stmt = $db->prepare("SELECT file_path FROM production_images WHERE image_id = ?");
            $stmt->execute([$imageId]);
            $image = $stmt->fetch();
            
            if (!$image) {
                throw new Exception('Image not found');
            }
            
            // Delete from database
            $stmt = $db->prepare("DELETE FROM production_images WHERE image_id = ?");
            $result = $stmt->execute([$imageId]);
            
            if ($result) {
                // Delete physical file
                $fullPath = '../' . $image['file_path'];
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
                
                echo json_encode(['success' => true, 'message' => 'Image deleted successfully']);
            } else {
                throw new Exception('Failed to delete image from database');
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error deleting image: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>