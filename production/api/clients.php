<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific client
            $stmt = $db->prepare("SELECT * FROM production_clients WHERE client_id = ?");
            $stmt->execute([$_GET['id']]);
            $client = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $client]);
        } elseif(isset($_GET['search'])) {
            // Search clients by name or email
            $search = '%' . $_GET['search'] . '%';
            $stmt = $db->prepare("SELECT * FROM production_clients WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? ORDER BY first_name, last_name");
            $stmt->execute([$search, $search, $search]);
            $clients = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $clients]);
        } else {
            // Get all clients
            $stmt = $db->query("SELECT * FROM production_clients ORDER BY created_date DESC");
            $clients = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $clients]);
        }
        break;

    case 'POST':
        // Create new client
        $stmt = $db->prepare("INSERT INTO production_clients (first_name, last_name, email, phone, created_date, modified_date) VALUES (?, ?, ?, ?, NOW(), NOW())");
        
        $result = $stmt->execute([
            $input['first_name'],
            $input['last_name'],
            $input['email'],
            $input['phone'] ?? null
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Client created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating client']);
        }
        break;

    case 'PUT':
        // Update client
        $stmt = $db->prepare("UPDATE production_clients SET first_name=?, last_name=?, email=?, phone=?, modified_date=NOW() WHERE client_id=?");
        
        $result = $stmt->execute([
            $input['first_name'],
            $input['last_name'],
            $input['email'],
            $input['phone'] ?? null,
            $input['client_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Client updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating client']);
        }
        break;

    case 'DELETE':
        // Delete client
        $stmt = $db->prepare("DELETE FROM production_clients WHERE client_id = ?");
        $result = $stmt->execute([$input['client_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Client deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting client']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>