<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['order_id'])) {
            // Get files for specific order
            $stmt = $db->prepare("
                SELECT f.*, u.username as uploaded_by, o.delivery_date, c.first_name, c.last_name
                FROM production_commandes_fichiers f
                JOIN production_utilisateurs u ON f.uploaded_user = u.user_id
                JOIN production_commandes_surmesure o ON f.order_id = o.order_id
                JOIN production_clients c ON o.client_id = c.client_id
                WHERE f.order_id = ?
                ORDER BY f.upload_date DESC
            ");
            $stmt->execute([$_GET['order_id']]);
            $files = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $files]);
        } elseif(isset($_GET['file_type'])) {
            // Get files by type
            $stmt = $db->prepare("
                SELECT f.*, u.username as uploaded_by, o.delivery_date, c.first_name, c.last_name
                FROM production_commandes_fichiers f
                JOIN production_utilisateurs u ON f.uploaded_user = u.user_id
                JOIN production_commandes_surmesure o ON f.order_id = o.order_id
                JOIN production_clients c ON o.client_id = c.client_id
                WHERE f.file_type = ?
                ORDER BY f.upload_date DESC
            ");
            $stmt->execute([$_GET['file_type']]);
            $files = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $files]);
        } else {
            // Get all files
            $stmt = $db->query("
                SELECT f.*, u.username as uploaded_by, o.delivery_date, c.first_name, c.last_name
                FROM production_commandes_fichiers f
                JOIN production_utilisateurs u ON f.uploaded_user = u.user_id
                JOIN production_commandes_surmesure o ON f.order_id = o.order_id
                JOIN production_clients c ON o.client_id = c.client_id
                ORDER BY f.upload_date DESC
            ");
            $files = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $files]);
        }
        break;

    case 'POST':
        // Upload new file
        $stmt = $db->prepare("INSERT INTO production_commandes_fichiers (order_id, file_path, file_type, uploaded_user, upload_date) VALUES (?, ?, ?, ?, NOW())");
        
        $result = $stmt->execute([
            $input['order_id'],
            $input['file_path'],
            $input['file_type'],
            $input['uploaded_user']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'File uploaded successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error uploading file']);
        }
        break;

    case 'PUT':
        // Update file info
        $stmt = $db->prepare("UPDATE production_commandes_fichiers SET order_id=?, file_path=?, file_type=? WHERE file_id=?");
        
        $result = $stmt->execute([
            $input['order_id'],
            $input['file_path'],
            $input['file_type'],
            $input['file_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'File updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating file']);
        }
        break;

    case 'DELETE':
        // Delete file
        $stmt = $db->prepare("DELETE FROM production_commandes_fichiers WHERE file_id = ?");
        $result = $stmt->execute([$input['file_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting file']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>