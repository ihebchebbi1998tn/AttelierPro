<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific category
            $stmt = $db->prepare("SELECT * FROM production_matieres_category WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $category = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $category]);
            
        } elseif(isset($_GET['active_only'])) {
            // Get only active categories
            $stmt = $db->query("SELECT * FROM production_matieres_category WHERE active = 1 ORDER BY nom");
            $categories = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $categories]);
            
        } elseif(isset($_GET['with_material_count'])) {
            // Get categories with material counts
            $stmt = $db->query("
                SELECT c.*, 
                       COUNT(m.id) as material_count
                FROM production_matieres_category c
                LEFT JOIN production_matieres m ON c.id = m.category_id
                GROUP BY c.id
                ORDER BY c.nom
            ");
            $categories = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $categories]);
            
        } else {
            // Get all categories
            $stmt = $db->query("SELECT * FROM production_matieres_category ORDER BY nom");
            $categories = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $categories]);
        }
        break;

    case 'POST':
        // Create new category
        try {
            $stmt = $db->prepare("
                INSERT INTO production_matieres_category 
                (nom, description, active, created_at, updated_at) 
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            
            $result = $stmt->execute([
                $input['nom'],
                $input['description'] ?? null,
                $input['active'] ?? 1
            ]);
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Category created successfully', 'id' => $db->lastInsertId()]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error creating category']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                echo json_encode(['success' => false, 'message' => 'Category name already exists']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Update category
        try {
            $stmt = $db->prepare("
                UPDATE production_matieres_category 
                SET nom=?, description=?, active=?, updated_at=NOW() 
                WHERE id=?
            ");
            
            $result = $stmt->execute([
                $input['nom'],
                $input['description'],
                $input['active'] ?? 1,
                $input['id']
            ]);
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Category updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error updating category']);
            }
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                echo json_encode(['success' => false, 'message' => 'Category name already exists']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        // Delete category (with safety check)
        try {
            $db->beginTransaction();
            
            // Check if category has materials
            $stmt = $db->prepare("SELECT COUNT(*) as material_count FROM production_matieres WHERE category_id = ?");
            $stmt->execute([$input['id']]);
            $result = $stmt->fetch();
            
            if($result['material_count'] > 0) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete category with existing materials']);
                break;
            }
            
            // Delete category
            $stmt = $db->prepare("DELETE FROM production_matieres_category WHERE id = ?");
            $result = $stmt->execute([$input['id']]);
            
            $db->commit();
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error deleting category']);
            }
            
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Error deleting category: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>