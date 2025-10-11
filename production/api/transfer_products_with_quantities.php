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

    $database = new Database();
    $db = $database->getConnection();

    $transferred = 0;
    $errors = [];

    $db->beginTransaction();

    foreach ($products as $product) {
        try {
            // Check if product already exists in production_ready_products
            $checkStmt = $db->prepare("SELECT id, production_quantities FROM production_ready_products WHERE external_product_id = ? AND boutique_origin = ?");
            $checkStmt->execute([$product['external_product_id'], $boutique]);
            $existingProduct = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingProduct) {
                // Product exists - merge quantities instead of skipping
                if (isset($product['size_quantities']) && !empty($product['size_quantities'])) {
                    // Get existing production quantities
                    $existingQuantities = [];
                    if (!empty($existingProduct['production_quantities'])) {
                        $existingQuantities = json_decode($existingProduct['production_quantities'], true) ?: [];
                    }
                    
                    // Merge new quantities with existing (add them together)
                    foreach ($product['size_quantities'] as $size => $quantity) {
                        if ($quantity > 0) {
                            $existingQty = isset($existingQuantities[$size]) ? intval($existingQuantities[$size]) : 0;
                            $existingQuantities[$size] = $existingQty + intval($quantity);
                        }
                    }
                    
                    // Update production quantities and reset is_seen to 0, and update specifications
                    $currentDate = date('Y-m-d');
                    $productionSpecsJson = isset($product['production_specifications']) ? json_encode($product['production_specifications']) : null;
                    
                    $updateStmt = $db->prepare("
                        UPDATE production_ready_products 
                        SET production_quantities = ?, 
                            production_specifications = ?,
                            is_seen = 0,
                            transfer_date = ?,
                            updated_at = NOW()
                        WHERE id = ?
                    ");
                    $mergedQuantitiesJson = json_encode($existingQuantities);
                    $updateStmt->execute([$mergedQuantitiesJson, $productionSpecsJson, $currentDate, $existingProduct['id']]);
                    
                    // Update product sizes configuration
                    foreach ($product['size_quantities'] as $size => $quantity) {
                        if ($quantity > 0) {
                            try {
                                // Determine size type based on size value
                                $sizeType = 'clothing'; // default
                                if (is_numeric($size)) {
                                    if (intval($size) >= 30 && intval($size) <= 66) {
                                        $sizeType = 'numeric_pants';
                                    } elseif (intval($size) >= 39 && intval($size) <= 47) {
                                        $sizeType = 'shoes';
                                    } elseif (intval($size) >= 85 && intval($size) <= 125) {
                                        $sizeType = 'belts';
                                    }
                                }
                                
                                $sizeStmt = $db->prepare("
                                    INSERT INTO product_sizes_config (product_id, size_type, size_value, is_active, created_at, updated_at) 
                                    VALUES (?, ?, ?, 1, NOW(), NOW())
                                    ON DUPLICATE KEY UPDATE is_active = 1, updated_at = NOW()
                                ");
                                $sizeStmt->execute([$existingProduct['id'], $sizeType, $size]);
                            } catch (Exception $sizeError) {
                                error_log("Size update error for product {$existingProduct['id']}, size $size: " . $sizeError->getMessage());
                            }
                        }
                    }
                    
                    $transferred++;
                } else {
                    $errors[] = "Produit {$product['nom_product']} existe déjà sans nouvelles quantités";
                }
                continue;
            }

            // Product doesn't exist - create new entry
            // Prepare production quantities JSON from size quantities if provided
            $productionQuantities = null;
            $sizesData = null;
            
            if (isset($product['size_quantities']) && !empty($product['size_quantities'])) {
                $productionQuantities = json_encode($product['size_quantities']);
                
                // Auto-configure sizes from production quantities if no sizes are configured
                $formattedSizes = [];
                foreach ($product['size_quantities'] as $size => $quantity) {
                    if ($quantity > 0) {
                        $formattedSizes[$size . '_size'] = $quantity;
                    }
                }
                $sizesData = json_encode($formattedSizes);
            }

            // Prepare INSERT statement with enhanced fields
            $currentDate = date('Y-m-d');
            $productionSpecsJson = isset($product['production_specifications']) ? json_encode($product['production_specifications']) : null;
            
            $stmt = $db->prepare("
                INSERT INTO production_ready_products 
                (boutique_origin, external_product_id, reference_product, nom_product, 
                 img_product, description_product, type_product, category_product, 
                 itemgroup_product, price_product, qnty_product, color_product, 
                 collection_product, auto_replenishment, auto_replenishment_quantity, 
                 auto_replenishment_quantity_sizes, sizes_data, production_quantities,
                 production_specifications, status_product, transferred_at, transfer_date, is_seen) 
                VALUES 
                (:boutique_origin, :external_product_id, :reference_product, :nom_product, 
                 :img_product, :description_product, :type_product, :category_product, 
                 :itemgroup_product, :price_product, :qnty_product, :color_product, 
                 :collection_product, :auto_replenishment, :auto_replenishment_quantity, 
                 :auto_replenishment_quantity_sizes, :sizes_data, :production_quantities,
                 :production_specifications, 'awaiting_production', :transferred_at, :transfer_date, 0)
            ");
            
            // Bind parameters
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
            $stmt->bindValue(':sizes_data', $sizesData); // Auto-configured from production quantities
            $stmt->bindValue(':production_quantities', $productionQuantities);
            $stmt->bindValue(':production_specifications', $productionSpecsJson);
            $stmt->bindValue(':transferred_at', $currentDate);
            $stmt->bindValue(':transfer_date', $currentDate);
            
            if ($stmt->execute()) {
                $productId = $db->lastInsertId();
                
                // Auto-create product sizes configuration if size quantities were provided
                if (isset($product['size_quantities']) && !empty($product['size_quantities'])) {
                    foreach ($product['size_quantities'] as $size => $quantity) {
                        if ($quantity > 0) {
                            try {
                                // Determine size type based on size value
                                $sizeType = 'clothing'; // default
                                if (is_numeric($size)) {
                                    if (intval($size) >= 30 && intval($size) <= 66) {
                                        $sizeType = 'numeric_pants';
                                    } elseif (intval($size) >= 39 && intval($size) <= 47) {
                                        $sizeType = 'shoes';
                                    } elseif (intval($size) >= 85 && intval($size) <= 125) {
                                        $sizeType = 'belts';
                                    }
                                }
                                
                                $sizeStmt = $db->prepare("
                                    INSERT INTO product_sizes_config (product_id, size_type, size_value, is_active, created_at, updated_at) 
                                    VALUES (?, ?, ?, 1, NOW(), NOW())
                                    ON DUPLICATE KEY UPDATE is_active = 1, updated_at = NOW()
                                ");
                                $sizeStmt->execute([$productId, $sizeType, $size]);
                            } catch (Exception $sizeError) {
                                // Log size creation error but don't fail the transfer
                                error_log("Size creation error for product $productId, size $size: " . $sizeError->getMessage());
                            }
                        }
                    }
                }
                
                $transferred++;
            } else {
                $errors[] = "Erreur avec {$product['nom_product']}: " . implode(', ', $stmt->errorInfo());
            }
            
        } catch (Exception $e) {
            $errors[] = "Erreur avec {$product['nom_product']}: " . $e->getMessage();
        }
    }

    $db->commit();

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
    if (isset($db)) {
        $db->rollBack();
    }
    
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