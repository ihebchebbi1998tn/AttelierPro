<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific quantity type
            $stmt = $db->prepare("SELECT * FROM production_quantity_types WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $quantityType = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $quantityType]);
        } elseif(isset($_GET['active_only'])) {
            // Get only active quantity types
            $stmt = $db->query("SELECT * FROM production_quantity_types WHERE active = 1 ORDER BY nom");
            $quantityTypes = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $quantityTypes]);
        } else {
            // Get all quantity types
            $stmt = $db->query("SELECT * FROM production_quantity_types ORDER BY nom");
            $quantityTypes = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $quantityTypes]);
        }
        break;

    case 'POST':
        // Create new quantity type
        try {
            $stmt = $db->prepare("
                INSERT INTO production_quantity_types 
                (nom, unite, description, active, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            $result = $stmt->execute([
                $input['nom'],
                $input['unite'],
                $input['description'] ?? null,
                $input['active'] ?? 1
            ]);
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Quantity type created successfully', 'id' => $db->lastInsertId()]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error creating quantity type']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                echo json_encode(['success' => false, 'message' => 'Quantity type name already exists']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Update quantity type
        try {
            $stmt = $db->prepare("
                UPDATE production_quantity_types 
                SET nom=?, unite=?, description=?, active=? 
                WHERE id=?
            ");
            
            $result = $stmt->execute([
                $input['nom'],
                $input['unite'],
                $input['description'],
                $input['active'] ?? 1,
                $input['id']
            ]);
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Quantity type updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error updating quantity type']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                echo json_encode(['success' => false, 'message' => 'Quantity type name already exists']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        // Delete quantity type (with safety check)
        try {
            $db->beginTransaction();
            
            // Check if quantity type is used by materials
            $stmt = $db->prepare("SELECT COUNT(*) as material_count FROM production_matieres WHERE quantity_type_id = ?");
            $stmt->execute([$input['id']]);
            $result = $stmt->fetch();
            
            if($result['material_count'] > 0) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete quantity type with existing materials']);
                break;
            }
            
            // Delete quantity type
            $stmt = $db->prepare("DELETE FROM production_quantity_types WHERE id = ?");
            $result = $stmt->execute([$input['id']]);
            
            $db->commit();
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Quantity type deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error deleting quantity type']);
            }
            
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Error deleting quantity type: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>