<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['products']) || !isset($input['boutique'])) {
        throw new Exception('Données manquantes: products et boutique requis');
    }

    $products = $input['products'];
    $boutique = $input['boutique'];
    
    if (empty($products)) {
        throw new Exception('Aucun produit à transférer');
    }

    // Initialize database connection using the same pattern as other API files
    $database = new Database();
    $db = $database->getConnection();

    $transferred = 0;
    $errors = [];

    foreach ($products as $product) {
        try {
            // Check if product already exists in production_ready_products
            $checkStmt = $db->prepare("SELECT id FROM production_ready_products WHERE external_product_id = ? AND boutique_origin = ?");
            $checkStmt->execute([$product['external_product_id'], $boutique]);
            
            if ($checkStmt->rowCount() > 0) {
                $errors[] = "Produit {$product['nom_product']} déjà transféré";
                continue;
            }

            // Prepare INSERT statement with only the fields that exist in the table
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
            
            // Bind parameters exactly as in production_ready_products.php
            $stmt->bindParam(':boutique_origin', $boutique);
            $stmt->bindParam(':external_product_id', $product['external_product_id']);
            $stmt->bindParam(':reference_product', $product['reference_product']);
            $stmt->bindParam(':nom_product', $product['nom_product']);
            $stmt->bindValue(':img_product', $product['img_product'] ?? null);
            $stmt->bindValue(':description_product', $product['description_product'] ?? null);
            $stmt->bindValue(':type_product', $product['type_product'] ?? null);
            $stmt->bindValue(':category_product', $product['category_product'] ?? null);
            $stmt->bindValue(':itemgroup_product', $product['itemgroup_product'] ?? null);
            $stmt->bindValue(':price_product', $product['price_product'] ?? null);
            $stmt->bindValue(':qnty_product', intval($product['qnty_product'] ?? 0));
            $stmt->bindValue(':color_product', $product['color_product'] ?? null);
            $stmt->bindValue(':collection_product', $product['collection_product'] ?? null);
            $stmt->bindValue(':auto_replenishment', ($product['AutoReapprovisionnement'] ?? 0) == 1 ? 1 : 0);
            $stmt->bindValue(':auto_replenishment_quantity', intval($product['AutoReapprovisionnement_quantity'] ?? 0));
            $stmt->bindValue(':auto_replenishment_quantity_sizes', $product['AutoReapprovisionnement_quantity_sizes'] ?? null);
            $stmt->bindValue(':sizes_data', null); // Will be configured later
            
            if ($stmt->execute()) {
                $transferred++;
            } else {
                $errors[] = "Erreur avec {$product['nom_product']}: " . implode(', ', $stmt->errorInfo());
            }
            
        } catch (Exception $e) {
            $errors[] = "Erreur avec {$product['nom_product']}: " . $e->getMessage();
        }
    }

    $response = [
        'success' => true,
        'message' => "$transferred produit(s) transféré(s) avec succès",
        'data' => [
            'transferred' => $transferred,
            'total' => count($products),
            'errors' => $errors
        ]
    ];

    if (!empty($errors)) {
        $response['message'] .= " (" . count($errors) . " erreur(s))";
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>