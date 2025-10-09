<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific product with its materials
            $stmt = $db->prepare("
                SELECT p.*, 
                       GROUP_CONCAT(CONCAT(m.nom, ':', pm.quantity_needed, ':', pm.size) SEPARATOR '|') as materials
                FROM production_produits p
                LEFT JOIN production_produit_matieres pm ON p.product_id = pm.product_id
                LEFT JOIN production_matieres m ON pm.material_id = m.id
                WHERE p.product_id = ?
                GROUP BY p.product_id
            ");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $product]);
        } elseif(isset($_GET['with_materials'])) {
            // Get all products with their required materials
            $stmt = $db->query("
                SELECT p.*, 
                       GROUP_CONCAT(CONCAT(m.nom, ':', pm.quantity_needed, ':', pm.size) SEPARATOR '|') as materials
                FROM production_produits p
                LEFT JOIN production_produit_matieres pm ON p.product_id = pm.product_id
                LEFT JOIN production_matieres m ON pm.material_id = m.id
                GROUP BY p.product_id
                ORDER BY p.created_date DESC
            ");
            $products = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $products]);
        } else {
            // Get all products
            $stmt = $db->query("SELECT * FROM production_produits ORDER BY created_date DESC");
            $products = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $products]);
        }
        break;

    case 'POST':
        // Create new product
        $other_attributes = isset($input['other_attributes']) ? json_encode($input['other_attributes']) : null;
        $stmt = $db->prepare("INSERT INTO production_produits (reference, title, color, other_attributes, created_user, modified_user, created_date, modified_date) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
        
        $result = $stmt->execute([
            $input['reference'],
            $input['title'],
            $input['color'],
            $other_attributes,
            $input['created_user'],
            $input['modified_user']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Product created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating product']);
        }
        break;

    case 'PUT':
        // Update product
        $other_attributes = isset($input['other_attributes']) ? json_encode($input['other_attributes']) : null;
        $stmt = $db->prepare("UPDATE production_produits SET reference=?, title=?, color=?, other_attributes=?, modified_user=?, modified_date=NOW() WHERE product_id=?");
        
        $result = $stmt->execute([
            $input['reference'],
            $input['title'],
            $input['color'],
            $other_attributes,
            $input['modified_user'],
            $input['product_id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating product']);
        }
        break;

    case 'DELETE':
        // Delete product
        $stmt = $db->prepare("DELETE FROM production_produits WHERE product_id = ?");
        $result = $stmt->execute([$input['product_id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting product']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>