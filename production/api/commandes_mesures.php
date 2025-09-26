<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['order_id'])) {
            // Get measurements for specific order
            $stmt = $db->prepare("SELECT * FROM production_commandes_mesures WHERE order_id = ?");
            $stmt->execute([$_GET['order_id']]);
            $measurements = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $measurements]);
        } else {
            // Get all measurements with order info
            $stmt = $db->query("
                SELECT m.*, o.delivery_date, c.first_name, c.last_name
                FROM production_commandes_mesures m
                JOIN production_commandes_surmesure o ON m.order_id = o.order_id
                JOIN production_clients c ON o.client_id = c.client_id
                ORDER BY o.created_date DESC
            ");
            $measurements = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $measurements]);
        }
        break;

    case 'POST':
        // Create new measurements
        $stmt = $db->prepare("INSERT INTO production_commandes_mesures (order_id, chest, waist, height, other) VALUES (?, ?, ?, ?, ?)");
        
        $result = $stmt->execute([
            $input['order_id'],
            $input['chest'],
            $input['waist'],
            $input['height'],
            $input['other'] ?? null
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurements created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating measurements']);
        }
        break;

    case 'PUT':
        // Update measurements
        $stmt = $db->prepare("UPDATE production_commandes_mesures SET chest=?, waist=?, height=?, other=? WHERE order_id=?");
        
        $result = $stmt->execute([
            $input['chest'],
            $input['waist'],
            $input['height'],
            $input['other'] ?? null,
            $input['order_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurements updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating measurements']);
        }
        break;

    case 'DELETE':
        // Delete measurements
        $stmt = $db->prepare("DELETE FROM production_commandes_mesures WHERE order_id = ?");
        $result = $stmt->execute([$input['order_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurements deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting measurements']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>