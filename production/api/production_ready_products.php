<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Récupérer un produit spécifique avec ses matériaux
                $stmt = $db->prepare("
                    SELECT p.*, 
                           GROUP_CONCAT(
                               CONCAT(pm.material_id, ':', pm.quantity_needed, ':', pm.quantity_type_id, ':', COALESCE(pm.size_specific, ''), ':', COALESCE(pm.notes, ''))
                               SEPARATOR '|'
                           ) as materials_config
                    FROM production_ready_products p 
                    LEFT JOIN production_product_materials pm ON p.id = pm.product_id
                    WHERE p.id = :id
                    GROUP BY p.id
                ");
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->execute();
                $product = $stmt->fetch();
                
                if ($product) {
                    // Parse materials config
                    if ($product['materials_config']) {
                        $materials = [];
                        $materialParts = explode('|', $product['materials_config']);
                        foreach ($materialParts as $part) {
                            list($materialId, $quantity, $quantityTypeId, $size, $notes) = explode(':', $part);
                            $materials[] = [
                                'material_id' => $materialId,
                                'quantity_needed' => $quantity,
                                'quantity_type_id' => $quantityTypeId,
                                'size_specific' => $size ?: null,
                                'notes' => $notes ?: null
                            ];
                        }
                        $product['materials'] = $materials;
                    } else {
                        $product['materials'] = [];
                    }
                    unset($product['materials_config']);
                    
                    echo json_encode(['success' => true, 'data' => $product]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Produit non trouvé']);
                }
            } else {
                // Récupérer tous les produits avec pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;
                $search = isset($_GET['search']) ? $_GET['search'] : '';
                $boutique = isset($_GET['boutique']) ? $_GET['boutique'] : '';
                
                $whereClause = "WHERE 1=1 AND is_in_production = 0";
                $params = [];
                
                if ($search) {
                    $whereClause .= " AND (nom_product LIKE :search OR reference_product LIKE :search)";
                    $params[':search'] = "%$search%";
                }
                
                if ($boutique) {
                    $whereClause .= " AND boutique_origin = :boutique";
                    $params[':boutique'] = $boutique;
                }
                
                // Count total
                $countStmt = $db->prepare("SELECT COUNT(*) as total FROM production_ready_products $whereClause");
                foreach ($params as $key => $value) {
                    $countStmt->bindValue($key, $value);
                }
                $countStmt->execute();
                $total = $countStmt->fetch()['total'];
                
                // Get products
                $stmt = $db->prepare("
                    SELECT * FROM production_ready_products 
                    $whereClause 
                    ORDER BY created_at DESC 
                    LIMIT :limit OFFSET :offset
                ");
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $products = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'data' => $products,
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit
                ]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validation des champs requis
            if (!isset($data['boutique_origin']) || !isset($data['external_product_id']) || 
                !isset($data['reference_product']) || !isset($data['nom_product'])) {
                echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
                break;
            }
            
            $stmt = $db->prepare("
                INSERT INTO production_ready_products 
                (boutique_origin, external_product_id, reference_product, nom_product, 
                 img_product, description_product, type_product, category_product, 
                 itemgroup_product, price_product, qnty_product, color_product, 
                 collection_product, auto_replenishment, auto_replenishment_quantity, 
                 auto_replenishment_quantity_sizes, sizes_data) 
                VALUES 
                (:boutique_origin, :external_product_id, :reference_product, :nom_product, 
                 :img_product, :description_product, :type_product, :category_product, 
                 :itemgroup_product, :price_product, :qnty_product, :color_product, 
                 :collection_product, :auto_replenishment, :auto_replenishment_quantity, 
                 :auto_replenishment_quantity_sizes, :sizes_data)
            ");
            
            $stmt->bindParam(':boutique_origin', $data['boutique_origin']);
            $stmt->bindParam(':external_product_id', $data['external_product_id']);
            $stmt->bindParam(':reference_product', $data['reference_product']);
            $stmt->bindParam(':nom_product', $data['nom_product']);
            $stmt->bindParam(':img_product', $data['img_product'] ?? null);
            $stmt->bindParam(':description_product', $data['description_product'] ?? null);
            $stmt->bindParam(':type_product', $data['type_product'] ?? null);
            $stmt->bindParam(':category_product', $data['category_product'] ?? null);
            $stmt->bindParam(':itemgroup_product', $data['itemgroup_product'] ?? null);
            $stmt->bindParam(':price_product', $data['price_product'] ?? null);
            $stmt->bindParam(':qnty_product', $data['qnty_product'] ?? 0);
            $stmt->bindParam(':color_product', $data['color_product'] ?? null);
            $stmt->bindParam(':collection_product', $data['collection_product'] ?? null);
            $stmt->bindParam(':auto_replenishment', $data['auto_replenishment'] ?? 0);
            $stmt->bindParam(':auto_replenishment_quantity', $data['auto_replenishment_quantity'] ?? 0);
            $stmt->bindParam(':auto_replenishment_quantity_sizes', $data['auto_replenishment_quantity_sizes'] ?? null);
            $stmt->bindParam(':sizes_data', $data['sizes_data'] ?? null);
            
            if ($stmt->execute()) {
                $productId = $db->lastInsertId();
                echo json_encode(['success' => true, 'message' => 'Produit créé avec succès', 'id' => $productId]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du produit']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID du produit requis']);
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE production_ready_products SET 
                reference_product = :reference_product,
                nom_product = :nom_product,
                img_product = :img_product,
                description_product = :description_product,
                type_product = :type_product,
                category_product = :category_product,
                itemgroup_product = :itemgroup_product,
                price_product = :price_product,
                qnty_product = :qnty_product,
                color_product = :color_product,
                collection_product = :collection_product,
                auto_replenishment = :auto_replenishment,
                auto_replenishment_quantity = :auto_replenishment_quantity,
                auto_replenishment_quantity_sizes = :auto_replenishment_quantity_sizes,
                sizes_data = :sizes_data,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':reference_product', $data['reference_product']);
            $stmt->bindParam(':nom_product', $data['nom_product']);
            $stmt->bindParam(':img_product', $data['img_product'] ?? null);
            $stmt->bindParam(':description_product', $data['description_product'] ?? null);
            $stmt->bindParam(':type_product', $data['type_product'] ?? null);
            $stmt->bindParam(':category_product', $data['category_product'] ?? null);
            $stmt->bindParam(':itemgroup_product', $data['itemgroup_product'] ?? null);
            $stmt->bindParam(':price_product', $data['price_product'] ?? null);
            $stmt->bindParam(':qnty_product', $data['qnty_product'] ?? 0);
            $stmt->bindParam(':color_product', $data['color_product'] ?? null);
            $stmt->bindParam(':collection_product', $data['collection_product'] ?? null);
            $stmt->bindParam(':auto_replenishment', $data['auto_replenishment'] ?? 0);
            $stmt->bindParam(':auto_replenishment_quantity', $data['auto_replenishment_quantity'] ?? 0);
            $stmt->bindParam(':auto_replenishment_quantity_sizes', $data['auto_replenishment_quantity_sizes'] ?? null);
            $stmt->bindParam(':sizes_data', $data['sizes_data'] ?? null);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Produit mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour du produit']);
            }
            break;
            
        case 'DELETE':
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID du produit requis']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_ready_products WHERE id = :id");
            $stmt->bindParam(':id', $_GET['id']);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Produit supprimé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du produit']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
            break;
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>