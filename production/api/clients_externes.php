<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific external client with their products
            $stmt = $db->prepare("
                SELECT ec.*, 
                       GROUP_CONCAT(CONCAT(ep.title, ':', ep.color) SEPARATOR '|') as products
                FROM production_clients_externes ec
                LEFT JOIN production_produits_externes ep ON ec.external_client_id = ep.external_client_id
                WHERE ec.external_client_id = ?
                GROUP BY ec.external_client_id
            ");
            $stmt->execute([$_GET['id']]);
            $client = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $client]);
        } elseif(isset($_GET['with_products'])) {
            // Get all external clients with product count
            $stmt = $db->query("
                SELECT ec.*, COUNT(ep.external_product_id) as product_count
                FROM production_clients_externes ec
                LEFT JOIN production_produits_externes ep ON ec.external_client_id = ep.external_client_id
                GROUP BY ec.external_client_id
                ORDER BY ec.created_date DESC
            ");
            $clients = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $clients]);
        } else {
            // Get all external clients
            $stmt = $db->query("SELECT * FROM production_clients_externes ORDER BY created_date DESC");
            $clients = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $clients]);
        }
        break;

    case 'POST':
        // Create new external client
        $stmt = $db->prepare("INSERT INTO production_clients_externes (name, contact, created_date) VALUES (?, ?, NOW())");
        
        $result = $stmt->execute([
            $input['name'],
            $input['contact'] ?? null
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'External client created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating external client']);
        }
        break;

    case 'PUT':
        // Update external client
        $stmt = $db->prepare("UPDATE production_clients_externes SET name=?, contact=? WHERE external_client_id=?");
        
        $result = $stmt->execute([
            $input['name'],
            $input['contact'] ?? null,
            $input['external_client_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'External client updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating external client']);
        }
        break;

    case 'DELETE':
        // Delete external client
        $stmt = $db->prepare("DELETE FROM production_clients_externes WHERE external_client_id = ?");
        $result = $stmt->execute([$input['external_client_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'External client deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting external client']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>