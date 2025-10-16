<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['product_id'])) {
            // Get measurements for specific product
            $stmt = $db->prepare("SELECT * FROM production_ready_products_mesure WHERE product_id = ? ORDER BY measurement_name ASC");
            $stmt->execute([$_GET['product_id']]);
            $measurements = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $measurements]);
        } else {
            // Get all measurements
            $stmt = $db->query("
                SELECT m.*, p.nom_product, p.reference_product
                FROM production_ready_products_mesure m
                JOIN production_ready_products p ON m.product_id = p.id
                ORDER BY p.nom_product ASC, m.measurement_name ASC
            ");
            $measurements = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $measurements]);
        }
        break;

    case 'POST':
        // Create new measurement
        if (!isset($input['product_id']) || !isset($input['measurement_name'])) {
            echo json_encode(['success' => false, 'message' => 'Product ID and measurement name are required']);
            break;
        }

        $stmt = $db->prepare("INSERT INTO production_ready_products_mesure (product_id, measurement_name, measurement_value, tolerance, unit, notes) VALUES (?, ?, ?, ?, ?, ?)");
        
        $result = $stmt->execute([
            $input['product_id'],
            $input['measurement_name'],
            $input['measurement_value'] ?? null,
            $input['tolerance'] ?? 0.5,
            $input['unit'] ?? 'cm',
            $input['notes'] ?? null
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurement created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating measurement']);
        }
        break;

    case 'PUT':
        // Update measurement
        if (!isset($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'Measurement ID is required']);
            break;
        }

        $stmt = $db->prepare("UPDATE production_ready_products_mesure SET measurement_name=?, measurement_value=?, tolerance=?, unit=?, notes=? WHERE id=?");
        
        $result = $stmt->execute([
            $input['measurement_name'],
            $input['measurement_value'],
            $input['tolerance'] ?? 0.5,
            $input['unit'] ?? 'cm',
            $input['notes'] ?? null,
            $input['id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurement updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating measurement']);
        }
        break;

    case 'DELETE':
        // Delete measurement
        if (!isset($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'Measurement ID is required']);
            break;
        }

        $stmt = $db->prepare("DELETE FROM production_ready_products_mesure WHERE id = ?");
        $result = $stmt->execute([$input['id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurement deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting measurement']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>