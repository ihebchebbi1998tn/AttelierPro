<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                $product_id = $_GET['product_id'];
                
                $stmt = $db->prepare("
                    SELECT id, product_id, measurement_types, measurements_data, tolerance_data, created_at, updated_at
                    FROM product_measurement_scales 
                    WHERE product_id = ?
                ");
                $stmt->execute([$product_id]);
                $result = $stmt->fetch();
                
                if ($result) {
                    // Decode JSON fields
                    $result['measurement_types'] = json_decode($result['measurement_types'], true) ?: [];
                    $result['measurements_data'] = json_decode($result['measurements_data'], true) ?: [];
                    $result['tolerance_data'] = json_decode($result['tolerance_data'], true) ?: [];
                    
                    echo json_encode([
                        'success' => true,
                        'data' => $result
                    ]);
                } else {
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'id' => null,
                            'product_id' => $product_id,
                            'measurement_types' => [],
                            'measurements_data' => [],
                            'tolerance_data' => []
                        ]
                    ]);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
            }
            break;

        case 'POST':
            if (!isset($input['product_id'])) {
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
                break;
            }

            $product_id = $input['product_id'];
            $measurement_types = isset($input['measurement_types']) ? json_encode($input['measurement_types']) : '[]';
            $measurements_data = isset($input['measurements_data']) ? json_encode($input['measurements_data']) : '{}';
            $tolerance_data = isset($input['tolerance_data']) ? json_encode($input['tolerance_data']) : '{}';

            // Check if record exists
            $checkStmt = $db->prepare("SELECT id FROM product_measurement_scales WHERE product_id = ?");
            $checkStmt->execute([$product_id]);
            
            if ($checkStmt->fetch()) {
                // Update existing record
                $stmt = $db->prepare("
                    UPDATE product_measurement_scales 
                    SET measurement_types = ?, measurements_data = ?, tolerance_data = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE product_id = ?
                ");
                $stmt->execute([$measurement_types, $measurements_data, $tolerance_data, $product_id]);
            } else {
                // Insert new record
                $stmt = $db->prepare("
                    INSERT INTO product_measurement_scales (product_id, measurement_types, measurements_data, tolerance_data)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$product_id, $measurement_types, $measurements_data, $tolerance_data]);
            }

            echo json_encode(['success' => true, 'message' => 'Measurement scale saved successfully']);
            break;

        case 'PUT':
            if (!isset($input['product_id'])) {
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
                break;
            }

            $product_id = $input['product_id'];
            $measurement_types = isset($input['measurement_types']) ? json_encode($input['measurement_types']) : '[]';
            $measurements_data = isset($input['measurements_data']) ? json_encode($input['measurements_data']) : '{}';
            $tolerance_data = isset($input['tolerance_data']) ? json_encode($input['tolerance_data']) : '{}';

            $stmt = $db->prepare("
                UPDATE product_measurement_scales 
                SET measurement_types = ?, measurements_data = ?, tolerance_data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ?
            ");
            $stmt->execute([$measurement_types, $measurements_data, $tolerance_data, $product_id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Measurement scale updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'No measurement scale found for this product']);
            }
            break;

        case 'DELETE':
            if (!isset($_GET['product_id'])) {
                echo json_encode(['success' => false, 'message' => 'Product ID required']);
                break;
            }

            $product_id = $_GET['product_id'];
            
            $stmt = $db->prepare("DELETE FROM product_measurement_scales WHERE product_id = ?");
            $stmt->execute([$product_id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Measurement scale deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'No measurement scale found for this product']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>