<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$startTime = microtime(true);
$userId = $_GET['user_id'] ?? 1; // ID utilisateur pour le log

try {
    // Récupérer les produits depuis l'API Spadadibattaglia
    $apiUrl = 'https://spadadibattaglia.com/api/get_auto_replenishment_products.php';
    $response = file_get_contents($apiUrl);
    
    if ($response === false) {
        throw new Exception('Impossible de récupérer les données depuis l\'API Spadadibattaglia');
    }
    
    $data = json_decode($response, true);
    
    if (!$data || !$data['success']) {
        throw new Exception('Réponse invalide de l\'API Spadadibattaglia');
    }
    
    $products = $data['data'];
    $productsFound = count($products);
    $productsAdded = 0;
    $productsUpdated = 0;
    
    $db->beginTransaction();
    
    foreach ($products as $product) {
        // Skip products with auto replenishment enabled
        if (isset($product['AutoReapprovisionnement']) && $product['AutoReapprovisionnement'] == 1) {
            continue;
        }
        
        // Préparer les données du produit
        $externalId = $product['id_product'];
        $reference = $product['reference_product'];
        $nom = $product['nom_product'];
        $img = $product['img_product'];
        $img2 = $product['img2_product'];
        $img3 = $product['img3_product'];
        $img4 = $product['img4_product'];
        $img5 = $product['img5_product'];
        $description = $product['description_product'];
        $type = $product['type_product'];
        $category = $product['category_product'];
        $itemgroup = $product['itemgroup_product'];
        $price = $product['price_product'];
        $quantity = $product['qnty_product'];
        $color = $product['color_product'];
        $collection = $product['collection_product'];
        $status = $product['status_product'];
        $autoReplenishment = $product['AutoReapprovisionnement'];
        $autoReplenishmentQty = $product['AutoReapprovisionnement_quantity'];
        $autoReplenishmentSizes = $product['AutoReapprovisionnement_quantity_sizes'];
        $discount = $product['discount_product'] ?? 0;
        $relatedProducts = $product['related_products'];
        $createDate = $product['createdate_product'];
        
        // Construire les données de tailles et extraire les valeurs individuelles
        $sizesData = [];
        $sizeFields = ['30_size', '31_size', '32_size', '33_size', '34_size', '36_size', '38_size', '39_size', '40_size', '41_size', '42_size', '43_size', '44_size', '45_size', '46_size', '47_size', '48_size', '50_size', '52_size', '54_size', '56_size', '58_size', '60_size', '62_size', '64_size', '66_size', 's_size', 'm_size', 'l_size', 'xl_size', 'xxl_size', '3xl_size', '4xl_size', 'xs_size', '85_size', '90_size', '95_size', '100_size', '105_size', '110_size', '115_size', '120_size', '125_size'];
        $sizeValues = [];
        
        foreach ($sizeFields as $sizeField) {
            $sizeValue = $product[$sizeField] ?? 0;
            $sizeValues[$sizeField] = $sizeValue;
            if ($sizeValue > 0) {
                $size = str_replace('_size', '', $sizeField);
                $sizesData[$size] = $sizeValue;
            }
        }
        
        $sizesDataJson = json_encode($sizesData);
        
        // Vérifier si le produit existe déjà
        $checkStmt = $db->prepare("SELECT id FROM production_ready_products WHERE boutique_origin = 'spadadibattaglia' AND external_product_id = :external_id");
        $checkStmt->bindParam(':external_id', $externalId);
        $checkStmt->execute();
        $existingProduct = $checkStmt->fetch();
        
        if ($existingProduct) {
            // Mettre à jour le produit existant
            $updateStmt = $db->prepare("
                UPDATE production_ready_products SET 
                reference_product = :reference,
                nom_product = :nom,
                img_product = :img,
                img2_product = :img2,
                img3_product = :img3,
                img4_product = :img4,
                img5_product = :img5,
                description_product = :description,
                type_product = :type,
                category_product = :category,
                itemgroup_product = :itemgroup,
                price_product = :price,
                qnty_product = :quantity,
                color_product = :color,
                collection_product = :collection,
                status_product = :status,
                auto_replenishment = :auto_replenishment,
                auto_replenishment_quantity = :auto_replenishment_quantity,
                auto_replenishment_quantity_sizes = :auto_replenishment_sizes,
                sizes_data = :sizes_data,
                discount_product = :discount,
                related_products = :related_products,
                createdate_product = :createdate,
                s_size = :s_size, m_size = :m_size, l_size = :l_size, xl_size = :xl_size, xxl_size = :xxl_size,
                3xl_size = :3xl_size, 4xl_size = :4xl_size, xs_size = :xs_size,
                30_size = :30_size, 31_size = :31_size, 32_size = :32_size, 33_size = :33_size, 34_size = :34_size,
                36_size = :36_size, 38_size = :38_size, 39_size = :39_size, 40_size = :40_size, 41_size = :41_size,
                42_size = :42_size, 43_size = :43_size, 44_size = :44_size, 45_size = :45_size, 46_size = :46_size,
                47_size = :47_size, 48_size = :48_size, 50_size = :50_size, 52_size = :52_size, 54_size = :54_size,
                56_size = :56_size, 58_size = :58_size, 60_size = :60_size, 62_size = :62_size, 64_size = :64_size,
                66_size = :66_size, 85_size = :85_size, 90_size = :90_size, 95_size = :95_size, 100_size = :100_size,
                105_size = :105_size, 110_size = :110_size, 115_size = :115_size, 120_size = :120_size, 125_size = :125_size,
                sync_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP,
                transfer_date = CURDATE(),
                is_seen = 0
                WHERE id = :id
            ");
            
            $updateStmt->bindParam(':id', $existingProduct['id']);
            $updateStmt->bindParam(':reference', $reference);
            $updateStmt->bindParam(':nom', $nom);
            $updateStmt->bindParam(':img', $img);
            $updateStmt->bindParam(':img2', $img2);
            $updateStmt->bindParam(':img3', $img3);
            $updateStmt->bindParam(':img4', $img4);
            $updateStmt->bindParam(':img5', $img5);
            $updateStmt->bindParam(':description', $description);
            $updateStmt->bindParam(':type', $type);
            $updateStmt->bindParam(':category', $category);
            $updateStmt->bindParam(':itemgroup', $itemgroup);
            $updateStmt->bindParam(':price', $price);
            $updateStmt->bindParam(':quantity', $quantity);
            $updateStmt->bindParam(':color', $color);
            $updateStmt->bindParam(':collection', $collection);
            $updateStmt->bindParam(':status', $status);
            $updateStmt->bindParam(':auto_replenishment', $autoReplenishment);
            $updateStmt->bindParam(':auto_replenishment_quantity', $autoReplenishmentQty);
            $updateStmt->bindParam(':auto_replenishment_sizes', $autoReplenishmentSizes);
            $updateStmt->bindParam(':sizes_data', $sizesDataJson);
            $updateStmt->bindParam(':discount', $discount);
            $updateStmt->bindParam(':related_products', $relatedProducts);
            $updateStmt->bindParam(':createdate', $createDate);
            
            // Bind all size fields
            foreach ($sizeValues as $field => $value) {
                $updateStmt->bindParam(":$field", $value);
            }
            
            $updateStmt->execute();
            $productsUpdated++;
        } else {
            // Insérer un nouveau produit
            $insertStmt = $db->prepare("
                INSERT INTO production_ready_products 
                (boutique_origin, external_product_id, reference_product, nom_product, 
                 img_product, img2_product, img3_product, img4_product, img5_product,
                 description_product, type_product, category_product, itemgroup_product, 
                 price_product, qnty_product, color_product, collection_product, 
                 status_product, auto_replenishment, auto_replenishment_quantity, 
                 auto_replenishment_quantity_sizes, sizes_data, discount_product, related_products, createdate_product,
                 s_size, m_size, l_size, xl_size, xxl_size, 3xl_size, 4xl_size, xs_size,
                 30_size, 31_size, 32_size, 33_size, 34_size, 36_size, 38_size, 39_size, 40_size, 41_size,
                 42_size, 43_size, 44_size, 45_size, 46_size, 47_size, 48_size, 50_size, 52_size, 54_size,
                 56_size, 58_size, 60_size, 62_size, 64_size, 66_size, 85_size, 90_size, 95_size, 100_size,
                 105_size, 110_size, 115_size, 120_size, 125_size, sync_date, transfer_date, is_seen)
                VALUES 
                ('spadadibattaglia', :external_id, :reference, :nom, 
                 :img, :img2, :img3, :img4, :img5,
                 :description, :type, :category, :itemgroup, 
                 :price, :quantity, :color, :collection, 
                 :status, :auto_replenishment, :auto_replenishment_quantity, 
                 :auto_replenishment_sizes, :sizes_data, :discount, :related_products, :createdate,
                 :s_size, :m_size, :l_size, :xl_size, :xxl_size, :3xl_size, :4xl_size, :xs_size,
                 :30_size, :31_size, :32_size, :33_size, :34_size, :36_size, :38_size, :39_size, :40_size, :41_size,
                 :42_size, :43_size, :44_size, :45_size, :46_size, :47_size, :48_size, :50_size, :52_size, :54_size,
                 :56_size, :58_size, :60_size, :62_size, :64_size, :66_size, :85_size, :90_size, :95_size, :100_size,
                 :105_size, :110_size, :115_size, :120_size, :125_size, CURRENT_TIMESTAMP, CURDATE(), 0)
            ");
            
            $insertStmt->bindParam(':external_id', $externalId);
            $insertStmt->bindParam(':reference', $reference);
            $insertStmt->bindParam(':nom', $nom);
            $insertStmt->bindParam(':img', $img);
            $insertStmt->bindParam(':img2', $img2);
            $insertStmt->bindParam(':img3', $img3);
            $insertStmt->bindParam(':img4', $img4);
            $insertStmt->bindParam(':img5', $img5);
            $insertStmt->bindParam(':description', $description);
            $insertStmt->bindParam(':type', $type);
            $insertStmt->bindParam(':category', $category);
            $insertStmt->bindParam(':itemgroup', $itemgroup);
            $insertStmt->bindParam(':price', $price);
            $insertStmt->bindParam(':quantity', $quantity);
            $insertStmt->bindParam(':color', $color);
            $insertStmt->bindParam(':collection', $collection);
            $insertStmt->bindParam(':status', $status);
            $insertStmt->bindParam(':auto_replenishment', $autoReplenishment);
            $insertStmt->bindParam(':auto_replenishment_quantity', $autoReplenishmentQty);
            $insertStmt->bindParam(':auto_replenishment_sizes', $autoReplenishmentSizes);
            $insertStmt->bindParam(':sizes_data', $sizesDataJson);
            $insertStmt->bindParam(':discount', $discount);
            $insertStmt->bindParam(':related_products', $relatedProducts);
            $insertStmt->bindParam(':createdate', $createDate);
            
            // Bind all size fields
            foreach ($sizeValues as $field => $value) {
                $insertStmt->bindParam(":$field", $value);
            }
            
            $insertStmt->execute();
            $productsAdded++;
        }
    }
    
    $endTime = microtime(true);
    $duration = round(($endTime - $startTime) * 1000); // en millisecondes
    
    // Enregistrer le log de synchronisation
    $logStmt = $db->prepare("
        INSERT INTO production_sync_log 
        (boutique, sync_type, products_found, products_added, products_updated, status, sync_duration, started_by) 
        VALUES ('spadadibattaglia', 'manual', :products_found, :products_added, :products_updated, 'success', :duration, :user_id)
    ");
    $logStmt->bindParam(':products_found', $productsFound);
    $logStmt->bindParam(':products_added', $productsAdded);
    $logStmt->bindParam(':products_updated', $productsUpdated);
    $logStmt->bindParam(':duration', $duration);
    $logStmt->bindParam(':user_id', $userId);
    $logStmt->execute();
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Synchronisation Spadadibattaglia terminée avec succès',
        'data' => [
            'boutique' => 'spadadibattaglia',
            'products_found' => $productsFound,
            'products_added' => $productsAdded,
            'products_updated' => $productsUpdated,
            'duration_ms' => $duration
        ]
    ]);
    
} catch (Exception $e) {
    $db->rollback();
    
    $endTime = microtime(true);
    $duration = round(($endTime - $startTime) * 1000);
    
    // Enregistrer le log d'erreur
    $logStmt = $db->prepare("
        INSERT INTO production_sync_log 
        (boutique, sync_type, status, error_message, sync_duration, started_by) 
        VALUES ('spadadibattaglia', 'manual', 'error', :error_message, :duration, :user_id)
    ");
    $logStmt->bindParam(':error_message', $e->getMessage());
    $logStmt->bindParam(':duration', $duration);
    $logStmt->bindParam(':user_id', $userId);
    $logStmt->execute();
    
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la synchronisation Spadadibattaglia: ' . $e->getMessage()
    ]);
}
?>