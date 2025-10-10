<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['product_id'])) {
            // Get materials for specific product
            $stmt = $db->prepare("
                SELECT pm.*, m.title as material_title, m.color as material_color, m.quantity_type
                FROM production_produit_matieres pm
                JOIN production_matieres m ON pm.material_id = m.material_id
                WHERE pm.product_id = ?
                ORDER BY m.title
            ");
            $stmt->execute([$_GET['product_id']]);
            $materials = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $materials]);
        } elseif(isset($_GET['material_id'])) {
            // Get products using specific material
            $stmt = $db->prepare("
                SELECT pm.*, p.title as product_title, p.color as product_color
                FROM production_produit_matieres pm
                JOIN production_produits p ON pm.product_id = p.product_id
                WHERE pm.material_id = ?
                ORDER BY p.title
            ");
            $stmt->execute([$_GET['material_id']]);
            $products = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $products]);
        } else {
            // Get all product-material relationships
            $stmt = $db->query("
                SELECT pm.*, p.title as product_title, m.title as material_title
                FROM production_produit_matieres pm
                JOIN production_produits p ON pm.product_id = p.product_id
                JOIN production_matieres m ON pm.material_id = m.material_id
                ORDER BY p.title, m.title
            ");
            $relations = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $relations]);
        }
        break;

    case 'POST':
        // Create new product-material relationship
        $stmt = $db->prepare("INSERT INTO production_produit_matieres (product_id, material_id, quantity_needed, size) VALUES (?, ?, ?, ?)");
        
        $result = $stmt->execute([
            $input['product_id'],
            $input['material_id'],
            $input['quantity_needed'],
            $input['size'] ?? null
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Product-material relationship created successfully', 'id' => $db->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating product-material relationship']);
        }
        break;

    case 'PUT':
        // Update product-material relationship
        $stmt = $db->prepare("UPDATE production_produit_matieres SET product_id=?, material_id=?, quantity_needed=?, size=? WHERE id=?");
        
        $result = $stmt->execute([
            $input['product_id'],
            $input['material_id'],
            $input['quantity_needed'],
            $input['size'] ?? null,
            $input['id']
        ]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Product-material relationship updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating product-material relationship']);
        }
        break;

    case 'DELETE':
        // Delete product-material relationship
        $stmt = $db->prepare("DELETE FROM production_produit_matieres WHERE id = ?");
        $result = $stmt->execute([$input['id']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Product-material relationship deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting product-material relationship']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>