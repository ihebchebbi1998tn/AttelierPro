<?php
include_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $client_id = isset($_GET['client_id']) ? $_GET['client_id'] : null;
        
        if (!$client_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Client ID is required'
            ]);
            exit;
        }

        // Get client information
        $clientQuery = "SELECT `id`, `name`, `email`, `phone`, `address`, `website`, `created_date`, `updated_date` 
                       FROM `production_soustraitance_clients` 
                       WHERE `id` = :client_id";
        
        $clientStmt = $db->prepare($clientQuery);
        $clientStmt->bindParam(':client_id', $client_id);
        $clientStmt->execute();
        $client = $clientStmt->fetch();

        if (!$client) {
            echo json_encode([
                'success' => false,
                'message' => 'Client not found'
            ]);
            exit;
        }

        // Get client's products
        $productsQuery = "SELECT `id`, `client_id`, `boutique_origin`, `external_product_id`, `reference_product`, 
                                `nom_product`, `img_product`, `img2_product`, `img3_product`, `img4_product`, `img5_product`, 
                                `description_product`, `type_product`, `category_product`, `itemgroup_product`, 
                                `price_product`, `qnty_product`, `color_product`, `collection_product`, `status_product`, 
                                `auto_replenishment`, `auto_replenishment_quantity`, `auto_replenishment_quantity_sizes`, 
                                `sizes_data`, `discount_product`, `related_products`, `createdate_product`, 
                                `size_xs`, `size_s`, `size_m`, `size_l`, `size_xl`, `size_xxl`, `size_3xl`, `size_4xl`, 
                                `size_30`, `size_31`, `size_32`, `size_33`, `size_34`, `size_36`, `size_38`, `size_39`, 
                                `size_40`, `size_41`, `size_42`, `size_43`, `size_44`, `size_45`, `size_46`, `size_47`, 
                                `size_48`, `size_50`, `size_52`, `size_54`, `size_56`, `size_58`, `size_60`, `size_62`, 
                                `size_64`, `size_66`, `size_85`, `size_90`, `size_95`, `size_100`, `size_105`, `size_110`, 
                                `size_115`, `size_120`, `size_125`, `materials_configured`, `sync_date`, `created_at`, `updated_at` 
                         FROM `production_soustraitance_products` 
                         WHERE `client_id` = :client_id 
                         ORDER BY `created_at` DESC";
        
        $productsStmt = $db->prepare($productsQuery);
        $productsStmt->bindParam(':client_id', $client_id);
        $productsStmt->execute();
        $products = $productsStmt->fetchAll();

        // Get client's materials (materials where extern_customer_id = client_id)
        $materialsQuery = "SELECT `id`, `nom`, `reference`, `description`, `category_id`, `quantity_type_id`, 
                                 `quantite_stock`, `quantite_min`, `quantite_max`, `prix_unitaire`, `location`, 
                                 `couleur`, `taille`, `fournisseur`, `id_fournisseur`, `date_achat`, `date_expiration`, 
                                 `image_url`, `active`, `created_at`, `updated_at`, `other_attributes`, `materiere_type`, 
                                 `extern_customer_id` 
                          FROM `production_matieres` 
                          WHERE `extern_customer_id` = :client_id 
                          ORDER BY `nom` ASC";
        
        $materialsStmt = $db->prepare($materialsQuery);
        $materialsStmt->bindParam(':client_id', $client_id);
        $materialsStmt->execute();
        $materials = $materialsStmt->fetchAll();

        // Get product materials for each product
        $productMaterials = [];
        if (!empty($products)) {
            $productIds = array_column($products, 'id');
            $placeholders = str_repeat('?,', count($productIds) - 1) . '?';
            
            $productMaterialsQuery = "SELECT pm.*, m.nom as material_name, m.reference as material_reference, 
                                            qt.name as quantity_type_name
                                     FROM `production_soustraitance_product_materials` pm
                                     LEFT JOIN `production_matieres` m ON pm.material_id = m.id
                                     LEFT JOIN `production_quantity_types` qt ON pm.quantity_type_id = qt.id
                                     WHERE pm.product_id IN ($placeholders)
                                     ORDER BY pm.product_id, m.nom";
            
            $productMaterialsStmt = $db->prepare($productMaterialsQuery);
            $productMaterialsStmt->execute($productIds);
            $allProductMaterials = $productMaterialsStmt->fetchAll();
            
            // Group by product_id
            foreach ($allProductMaterials as $material) {
                $productMaterials[$material['product_id']][] = $material;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'client' => $client,
                'products' => $products,
                'materials' => $materials,
                'product_materials' => $productMaterials
            ]
        ]);

    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>