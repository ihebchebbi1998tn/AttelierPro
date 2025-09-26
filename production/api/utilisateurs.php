<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific user
            $stmt = $db->prepare("SELECT * FROM production_utilisateurs WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $user = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $user]);
        } elseif(isset($_GET['role'])) {
            // Get users by role
            $stmt = $db->prepare("SELECT * FROM production_utilisateurs WHERE role = ?");
            $stmt->execute([$_GET['role']]);
            $users = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $users]);
        } else {
            // Get all users
            $stmt = $db->query("SELECT * FROM production_utilisateurs ORDER BY created_at DESC");
            $users = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $users]);
        }
        break;

    case 'POST':
        // Create new user
        $stmt = $db->prepare("INSERT INTO production_utilisateurs (nom, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
        $result = $stmt->execute([$input['nom'], $input['email'], password_hash($input['password'], PASSWORD_DEFAULT), $input['role']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'User created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating user']);
        }
        break;

    case 'PUT':
        // Update user
        if(isset($input['password'])) {
            $input['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE production_utilisateurs SET nom=?, email=?, password=?, role=?, updated_at=NOW() WHERE id=?");
            $result = $stmt->execute([$input['nom'], $input['email'], $input['password'], $input['role'], $input['id']]);
        } else {
            $stmt = $db->prepare("UPDATE production_utilisateurs SET nom=?, email=?, role=?, updated_at=NOW() WHERE id=?");
            $result = $stmt->execute([$input['nom'], $input['email'], $input['role'], $input['id']]);
        }
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating user']);
        }
        break;

    case 'DELETE':
        // Delete user
        $stmt = $db->prepare("DELETE FROM production_utilisateurs WHERE id = ?");
        $result = $stmt->execute([$input['id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting user']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>