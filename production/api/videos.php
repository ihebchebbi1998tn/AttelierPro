<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['order_id'])) {
            // Get videos for specific order
            $stmt = $db->prepare("
                SELECT v.*, u.username as uploaded_by, o.delivery_date, c.first_name, c.last_name
                FROM production_videos v
                JOIN production_utilisateurs u ON v.uploaded_user = u.user_id
                JOIN production_commandes_surmesure o ON v.order_id = o.order_id
                JOIN production_clients c ON o.client_id = c.client_id
                WHERE v.order_id = ?
                ORDER BY v.upload_date DESC
            ");
            $stmt->execute([$_GET['order_id']]);
            $videos = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $videos]);
        } else {
            // Get all videos
            $stmt = $db->query("
                SELECT v.*, u.username as uploaded_by, o.delivery_date, c.first_name, c.last_name
                FROM production_videos v
                JOIN production_utilisateurs u ON v.uploaded_user = u.user_id
                JOIN production_commandes_surmesure o ON v.order_id = o.order_id
                JOIN production_clients c ON o.client_id = c.client_id
                ORDER BY v.upload_date DESC
            ");
            $videos = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $videos]);
        }
        break;

    case 'POST':
        // Upload new video
        $stmt = $db->prepare("INSERT INTO production_videos (order_id, file_path, uploaded_user, upload_date) VALUES (?, ?, ?, NOW())");
        
        $result = $stmt->execute([
            $input['order_id'],
            $input['file_path'],
            $input['uploaded_user']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Video uploaded successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error uploading video']);
        }
        break;

    case 'PUT':
        // Update video info
        $stmt = $db->prepare("UPDATE production_videos SET order_id=?, file_path=? WHERE video_id=?");
        
        $result = $stmt->execute([
            $input['order_id'],
            $input['file_path'],
            $input['video_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Video updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating video']);
        }
        break;

    case 'DELETE':
        // Delete video
        $stmt = $db->prepare("DELETE FROM production_videos WHERE video_id = ?");
        $result = $stmt->execute([$input['video_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Video deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting video']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>