<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['external_client_id'])) {
            // Get products for specific external client
            $stmt = $db->prepare("
                SELECT ep.*, ec.name as client_name, ec.contact as client_contact
                FROM production_produits_externes ep
                JOIN production_clients_externes ec ON ep.external_client_id = ec.external_client_id
                WHERE ep.external_client_id = ?
                ORDER BY ep.title
            ");
            $stmt->execute([$_GET['external_client_id']]);
            $products = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $products]);
        } else {
            // Get all external products with client info
            $stmt = $db->query("
                SELECT ep.*, ec.name as client_name, ec.contact as client_contact
                FROM production_produits_externes ep
                JOIN production_clients_externes ec ON ep.external_client_id = ec.external_client_id
                ORDER BY ec.name, ep.title
            ");
            $products = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $products]);
        }
        break;

    case 'POST':
        // Create new external product
        $stmt = $db->prepare("INSERT INTO production_produits_externes (external_client_id, title, color) VALUES (?, ?, ?)");
        
        $result = $stmt->execute([
            $input['external_client_id'],
            $input['title'],
            $input['color'] ?? null
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'External product created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating external product']);
        }
        break;

    case 'PUT':
        // Update external product
        $stmt = $db->prepare("UPDATE production_produits_externes SET external_client_id=?, title=?, color=? WHERE external_product_id=?");
        
        $result = $stmt->execute([
            $input['external_client_id'],
            $input['title'],
            $input['color'] ?? null,
            $input['external_product_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'External product updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating external product']);
        }
        break;

    case 'DELETE':
        // Delete external product
        $stmt = $db->prepare("DELETE FROM production_produits_externes WHERE external_product_id = ?");
        $result = $stmt->execute([$input['external_product_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'External product deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting external product']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>