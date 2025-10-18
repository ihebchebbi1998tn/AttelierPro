<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single template
                $stmt = $db->prepare("SELECT * FROM specification_templates WHERE id = :id");
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->execute();
                $template = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($template && $template['options']) {
                    $template['options'] = json_decode($template['options']);
                }
                
                echo json_encode(['success' => true, 'template' => $template]);
            } else {
                // Get all active templates ordered by display_order
                $stmt = $db->prepare("
                    SELECT * FROM specification_templates 
                    WHERE is_active = 1 
                    ORDER BY display_order ASC, name ASC
                ");
                $stmt->execute();
                $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($templates as &$template) {
                    if ($template['options']) {
                        $template['options'] = json_decode($template['options']);
                    }
                }
                
                echo json_encode(['success' => true, 'templates' => $templates]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['name']) || !isset($data['input_type'])) {
                throw new Exception("Name and input_type are required");
            }
            
            $options = null;
            if (isset($data['options']) && is_array($data['options'])) {
                $options = json_encode($data['options']);
            }
            
            $stmt = $db->prepare("
                INSERT INTO specification_templates 
                (name, input_type, options, display_order) 
                VALUES (:name, :input_type, :options, :display_order)
            ");
            
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':input_type', $data['input_type']);
            $stmt->bindParam(':options', $options);
            $display_order = $data['display_order'] ?? 0;
            $stmt->bindParam(':display_order', $display_order);
            
            $stmt->execute();
            $id = $db->lastInsertId();
            
            echo json_encode(['success' => true, 'id' => $id, 'message' => 'Template created successfully']);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['id'])) {
                throw new Exception("Template ID is required");
            }
            
            $updates = [];
            $params = [':id' => $data['id']];
            
            if (isset($data['name'])) {
                $updates[] = "name = :name";
                $params[':name'] = $data['name'];
            }
            
            if (isset($data['input_type'])) {
                $updates[] = "input_type = :input_type";
                $params[':input_type'] = $data['input_type'];
            }
            
            if (isset($data['options'])) {
                $updates[] = "options = :options";
                $params[':options'] = is_array($data['options']) ? json_encode($data['options']) : null;
            }
            
            if (isset($data['is_active'])) {
                $updates[] = "is_active = :is_active";
                $params[':is_active'] = $data['is_active'] ? 1 : 0;
            }
            
            if (isset($data['display_order'])) {
                $updates[] = "display_order = :display_order";
                $params[':display_order'] = $data['display_order'];
            }
            
            if (empty($updates)) {
                throw new Exception("No fields to update");
            }
            
            $sql = "UPDATE specification_templates SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['success' => true, 'message' => 'Template updated successfully']);
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['id'])) {
                throw new Exception("Template ID is required");
            }
            
            $stmt = $db->prepare("DELETE FROM specification_templates WHERE id = :id");
            $stmt->bindParam(':id', $data['id']);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Template deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
