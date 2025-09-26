<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            // Get all clients with their sur mesure orders
            $stmt = $db->query("
                SELECT DISTINCT
                    id as order_id,
                    client_name,
                    client_vorname,
                    client_email,
                    client_phone,
                    client_address,
                    client_region
                FROM production_surmesure_commandes
                ORDER BY client_name ASC
            ");
            $clients = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $clients]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error fetching clients: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>