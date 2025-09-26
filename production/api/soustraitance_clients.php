<?php
require_once 'config.php';

$database = new Database();
$conn = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single client
                $stmt = $conn->prepare("SELECT * FROM production_soustraitance_clients WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $client = $stmt->fetch();
                
                if ($client) {
                    echo json_encode([
                        'success' => true,
                        'data' => $client
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Client not found'
                    ]);
                }
            } else {
                // Get all clients
                $stmt = $conn->prepare("SELECT * FROM production_soustraitance_clients ORDER BY created_date DESC");
                $stmt->execute();
                $clients = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'data' => $clients
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['phone']) || !isset($data['address'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing required fields: name, email, phone, address'
                ]);
                break;
            }

            $stmt = $conn->prepare("INSERT INTO production_soustraitance_clients (name, email, phone, address, website) VALUES (?, ?, ?, ?, ?)");
            $result = $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['address'],
                $data['website'] ?? null
            ]);

            if ($result) {
                $newId = $conn->lastInsertId();
                echo json_encode([
                    'success' => true,
                    'message' => 'Client created successfully',
                    'id' => $newId
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create client'
                ]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data['id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing client ID'
                ]);
                break;
            }

            $updateFields = [];
            $params = [];

            if (isset($data['name'])) {
                $updateFields[] = "name = ?";
                $params[] = $data['name'];
            }
            if (isset($data['email'])) {
                $updateFields[] = "email = ?";
                $params[] = $data['email'];
            }
            if (isset($data['phone'])) {
                $updateFields[] = "phone = ?";
                $params[] = $data['phone'];
            }
            if (isset($data['address'])) {
                $updateFields[] = "address = ?";
                $params[] = $data['address'];
            }
            if (isset($data['website'])) {
                $updateFields[] = "website = ?";
                $params[] = $data['website'];
            }

            if (empty($updateFields)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'No fields to update'
                ]);
                break;
            }

            $params[] = $data['id'];
            $sql = "UPDATE production_soustraitance_clients SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $stmt = $conn->prepare($sql);
            $result = $stmt->execute($params);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Client updated successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update client'
                ]);
            }
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing client ID'
                ]);
                break;
            }

            $stmt = $conn->prepare("DELETE FROM production_soustraitance_clients WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Client deleted successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete client'
                ]);
            }
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Method not allowed'
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>