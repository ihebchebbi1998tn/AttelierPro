<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific order with client info
            $stmt = $db->prepare("
                SELECT o.*, c.first_name, c.last_name, c.email, c.phone,
                       u1.nom as created_by, u2.nom as modified_by
                FROM production_commandes_surmesure o
                JOIN production_clients c ON o.client_id = c.client_id
                LEFT JOIN production_utilisateurs u1 ON o.created_user = u1.id
                LEFT JOIN production_utilisateurs u2 ON o.modified_user = u2.id
                WHERE o.order_id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $order = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $order]);
        } elseif(isset($_GET['status'])) {
            // Get orders by status
            $stmt = $db->prepare("
                SELECT o.*, c.first_name, c.last_name, c.email
                FROM production_commandes_surmesure o
                JOIN production_clients c ON o.client_id = c.client_id
                WHERE o.status = ?
                ORDER BY o.delivery_date ASC
            ");
            $stmt->execute([$_GET['status']]);
            $orders = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $orders]);
        } elseif(isset($_GET['dashboard'])) {
            // Get dashboard data
            $stmt = $db->query("
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(DATEDIFF(delivery_date, NOW())) as avg_days_to_delivery
                FROM production_commandes_surmesure
                WHERE delivery_date >= CURDATE()
                GROUP BY status
            ");
            $dashboard = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $dashboard]);
        } else {
            // Get all orders
            $stmt = $db->query("
                SELECT o.*, c.first_name, c.last_name, c.email
                FROM production_commandes_surmesure o
                JOIN production_clients c ON o.client_id = c.client_id
                ORDER BY o.created_date DESC
            ");
            $orders = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $orders]);
        }
        break;

    case 'POST':
        // Create new order
        $other_attributes = isset($input['other_attributes']) ? json_encode($input['other_attributes']) : null;
        $stmt = $db->prepare("INSERT INTO production_commandes_surmesure (client_id, delivery_date, status, other_attributes, created_user, modified_user, created_date, modified_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
        
        $result = $stmt->execute([
            $input['client_id'],
            $input['delivery_date'],
            $input['status'],
            $other_attributes,
            $input['created_user'],
            $input['modified_user']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Order created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating order']);
        }
        break;

    case 'PUT':
        // Handle special production actions
        if(isset($input['action']) && $input['action'] == 'startProduction') {
            // Start production for custom order
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $_SERVER['HTTP_HOST'] . '/production/api/transactions_stock.php');
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'action' => 'startCommandeSurMesure',
                'order_id' => $input['order_id'],
                'user_id' => $input['user_id']
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            if($response) {
                $stock_result = json_decode($response, true);
                if($stock_result['success']) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Production started successfully',
                        'stock_alerts' => $stock_result['alerts'] ?? []
                    ]);
                } else {
                    echo json_encode($stock_result);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Error communicating with stock system']);
            }
        } else {
            // Update order
            $other_attributes = isset($input['other_attributes']) ? json_encode($input['other_attributes']) : null;
            $stmt = $db->prepare("UPDATE production_commandes_surmesure SET client_id=?, delivery_date=?, status=?, other_attributes=?, modified_user=?, modified_date=NOW() WHERE order_id=?");
            
            $result = $stmt->execute([
                $input['client_id'],
                $input['delivery_date'],
                $input['status'],
                $other_attributes,
                $input['modified_user'],
                $input['order_id']
            ]);
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Order updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error updating order']);
            }
        }
        break;

    case 'DELETE':
        // Delete order
        $stmt = $db->prepare("DELETE FROM production_commandes_surmesure WHERE order_id = ?");
        $result = $stmt->execute([$input['order_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Order deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting order']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage(), 'data' => []]);
}
?>