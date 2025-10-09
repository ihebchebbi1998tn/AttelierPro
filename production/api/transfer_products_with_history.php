
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['products']) || !isset($input['boutique'])) {
        throw new Exception('Products and boutique data required');
    }
    
    $products = $input['products'];
    $boutique = $input['boutique'];
    $mergeMode = $input['merge_mode'] ?? 'additive'; // 'additive' or 'override'
    
    $db->beginTransaction();
    
    $transferredCount = 0;
    $updatedCount = 0;
    $errors = [];
    
    foreach ($products as $product) {
        try {
            // Check if product already exists
            $checkStmt = $db->prepare("
                SELECT id, production_quantities, sizes_data, total_configured_quantity 
                FROM production_ready_products 
                WHERE boutique_origin = ? AND external_product_id = ?
            ");
            $checkStmt->execute([$boutique, $product['external_product_id']]);
            $existingProduct = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            $productId = null;
            $isUpdate = false;
            
            if ($existingProduct) {
                // Product exists - merge configuration
                $productId = $existingProduct['id'];
                $isUpdate = true;
                
                // Parse existing and new size quantities
                $existingSizes = json_decode($existingProduct['production_quantities'] ?? '{}', true) ?: [];
                $existingSizesData = json_decode($existingProduct['sizes_data'] ?? '{}', true) ?: [];
                $newSizes = $product['size_quantities'] ?? [];
                
                // Merge size configurations
                $mergedSizes = mergeSizeConfigurations($existingSizes, $newSizes, $mergeMode);
                $mergedSizesData = mergeSizesData($existingSizesData, $newSizes);
                
                // Create transfer batch record
                $batchStmt = $db->prepare("
                    INSERT INTO product_transfer_batches 
                    (product_id, boutique_origin, external_product_id, total_quantity, notes) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $totalNewQuantity = array_sum($newSizes);
                $notes = "Size configuration update - Mode: $mergeMode";
                $batchStmt->execute([$productId, $boutique, $product['external_product_id'], $totalNewQuantity, $notes]);
                $batchId = $db->lastInsertId();
                
                // Log size configuration changes
                logSizeConfigurationChanges($db, $productId, $batchId, $existingSizes, $newSizes, $mergeMode);
                
                // Update product with merged configuration
                $updateStmt = $db->prepare("
                    UPDATE production_ready_products 
                    SET production_quantities = ?, 
                        sizes_data = ?,
                        last_transfer_batch_id = ?,
                        size_configuration_version = size_configuration_version + 1,
                        total_configured_quantity = ?,
                        transferred_at = CURRENT_TIMESTAMP,
                        transfer_date = CURDATE(),
                        is_seen = 0,
                        status_product = 'transferred'
                    WHERE id = ?
                ");
                $totalMergedQuantity = array_sum($mergedSizes);
                $updateStmt->execute([
                    json_encode($mergedSizes),
                    json_encode($mergedSizesData),
                    $batchId,
                    $totalMergedQuantity,
                    $productId
                ]);
                
                $updatedCount++;
                
            } else {
                // New product - create fresh configuration
                $stmt = $db->prepare("
                    INSERT INTO production_ready_products 
                    (external_product_id, nom, prix, description, image1, image2, image3, image4, image5, 
                     boutique_origin, production_quantities, sizes_data, transferred_at, transfer_date, 
                     is_seen, status_product, total_configured_quantity, size_configuration_version) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURDATE(), 0, 'transferred', ?, 1)
                ");
                
                $sizesJson = json_encode($product['size_quantities'] ?? []);
                $sizesDataJson = generateSizesData($product['size_quantities'] ?? []);
                $totalQuantity = array_sum($product['size_quantities'] ?? []);
                
                $stmt->execute([
                    $product['external_product_id'],
                    $product['nom'],
                    $product['prix'],
                    $product['description'],
                    $product['image1'],
                    $product['image2'],
                    $product['image3'],
                    $product['image4'],
                    $product['image5'],
                    $boutique,
                    $sizesJson,
                    $sizesDataJson,
                    $totalQuantity
                ]);
                
                $productId = $db->lastInsertId();
                
                // Create initial transfer batch record
                $batchStmt = $db->prepare("
                    INSERT INTO product_transfer_batches 
                    (product_id, boutique_origin, external_product_id, total_quantity, notes) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $batchStmt->execute([$productId, $boutique, $product['external_product_id'], $totalQuantity, 'Initial product transfer']);
                $batchId = $db->lastInsertId();
                
                // Update product with batch ID
                $updateBatchStmt = $db->prepare("UPDATE production_ready_products SET last_transfer_batch_id = ? WHERE id = ?");
                $updateBatchStmt->execute([$batchId, $productId]);
                
                // Log initial size configuration
                logInitialSizeConfiguration($db, $productId, $batchId, $product['size_quantities'] ?? []);
                
                $transferredCount++;
            }
            
            // Update product sizes config
            if (!empty($product['size_quantities'])) {
                updateProductSizesConfig($db, $productId, $product['size_quantities']);
            }
            
        } catch (Exception $e) {
            $errors[] = "Product {$product['external_product_id']}: " . $e->getMessage();
        }
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Products processed successfully with size configuration history',
        'transferred_count' => $transferredCount,
        'updated_count' => $updatedCount,
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollback();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

// Helper functions
function mergeSizeConfigurations($existing, $new, $mode) {
    if ($mode === 'override') {
        // Override mode: new sizes replace existing ones completely
        return array_merge($existing, $new);
    } else {
        // Additive mode: add quantities together
        $merged = $existing;
        foreach ($new as $size => $quantity) {
            $merged[$size] = ($merged[$size] ?? 0) + $quantity;
        }
        return $merged;
    }
}

function mergeSizesData($existingData, $newSizes) {
    // Generate sizes data structure
    $sizesData = $existingData;
    foreach ($newSizes as $size => $quantity) {
        if (!isset($sizesData[$size])) {
            $sizesData[$size] = ['size' => $size, 'active' => true];
        }
    }
    return $sizesData;
}

function generateSizesData($sizeQuantities) {
    $sizesData = [];
    foreach ($sizeQuantities as $size => $quantity) {
        $sizesData[$size] = ['size' => $size, 'active' => true];
    }
    return json_encode($sizesData);
}

function logSizeConfigurationChanges($db, $productId, $batchId, $existingSizes, $newSizes, $mode) {
    $logStmt = $db->prepare("
        INSERT INTO product_size_configuration_history 
        (product_id, transfer_batch_id, size_type, size_value, quantity, action_type, previous_quantity) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    // Log existing sizes that are preserved
    foreach ($existingSizes as $size => $quantity) {
        if (!isset($newSizes[$size])) {
            $logStmt->execute([$productId, $batchId, 'clothing', $size, $quantity, 'preserved', $quantity]);
        }
    }
    
    // Log new and updated sizes
    foreach ($newSizes as $size => $quantity) {
        $previousQuantity = $existingSizes[$size] ?? 0;
        $actionType = $previousQuantity > 0 ? 'updated' : 'added';
        $finalQuantity = $mode === 'additive' ? $previousQuantity + $quantity : $quantity;
        
        $logStmt->execute([$productId, $batchId, 'clothing', $size, $finalQuantity, $actionType, $previousQuantity]);
    }
}

function logInitialSizeConfiguration($db, $productId, $batchId, $sizeQuantities) {
    $logStmt = $db->prepare("
        INSERT INTO product_size_configuration_history 
        (product_id, transfer_batch_id, size_type, size_value, quantity, action_type, previous_quantity) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($sizeQuantities as $size => $quantity) {
        $logStmt->execute([$productId, $batchId, 'clothing', $size, $quantity, 'initial', 0]);
    }
}

function updateProductSizesConfig($db, $productId, $sizeQuantities) {
    // Delete existing config
    $deleteStmt = $db->prepare("DELETE FROM product_sizes_config WHERE product_id = ?");
    $deleteStmt->execute([$productId]);
    
    // Insert new config
    $insertStmt = $db->prepare("
        INSERT INTO product_sizes_config (product_id, size_type, size_value, active) 
        VALUES (?, ?, ?, 1)
    ");
    
    foreach ($sizeQuantities as $size => $quantity) {
        if ($quantity > 0) {
            $insertStmt->execute([$productId, 'clothing', $size]);
        }
    }
}
?>
