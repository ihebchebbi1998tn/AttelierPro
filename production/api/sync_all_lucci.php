<?php
require_once 'config.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Start transaction
    $conn->beginTransaction();
    
    // Fetch all products from Lucci By Ey API
    $api_url = 'https://luccibyey.com.tn/api/get_all_products.php';
    $context = stream_context_create([
        'http' => [
            'timeout' => 30,
            'method' => 'GET',
            'header' => 'User-Agent: Mozilla/5.0'
        ]
    ]);
    
    $response = file_get_contents($api_url, false, $context);
    
    if ($response === false) {
        throw new Exception('Failed to fetch data from Lucci By Ey API');
    }
    
    $data = json_decode($response, true);
    
    if (!$data || !isset($data['data']) || !is_array($data['data'])) {
        throw new Exception('Invalid response format from Lucci By Ey API');
    }
    
    $products = $data['data'];
    $products_processed = 0;
    $products_added = 0;
    $products_updated = 0;
    
    foreach ($products as $product) {
        if (!isset($product['id_product'])) {
            continue;
        }
        
        // Check if product already exists
        $check_stmt = $conn->prepare("SELECT id FROM productions_products_lucci WHERE external_product_id = ?");
        $check_stmt->execute([$product['id_product']]);
        $existing = $check_stmt->fetch();
        
        // Prepare size fields
        $size_fields = [
            'xs_size', 's_size', 'm_size', 'l_size', 'xl_size', 'xxl_size', '3xl_size', '4xl_size',
            '30_size', '31_size', '32_size', '33_size', '34_size', '36_size', '38_size', '39_size',
            '40_size', '41_size', '42_size', '43_size', '44_size', '45_size', '46_size', '47_size',
            '48_size', '50_size', '52_size', '54_size', '56_size', '58_size', '60_size', '62_size',
            '64_size', '66_size', '85_size', '90_size', '95_size', '100_size', '105_size', '110_size',
            '115_size', '120_size', '125_size'
        ];
        
        if ($existing) {
            // Update existing product
            $update_sql = "UPDATE productions_products_lucci SET 
                reference_product = ?, nom_product = ?, img_product = ?, img2_product = ?, 
                img3_product = ?, img4_product = ?, img5_product = ?, description_product = ?,
                type_product = ?, category_product = ?, itemgroup_product = ?, price_product = ?,
                qnty_product = ?, color_product = ?, collection_product = ?, status_product = ?,
                discount_product = ?, AutoReapprovisionnement = ?, AutoReapprovisionnement_quantity = ?,
                AutoReapprovisionnement_quantity_sizes = ?, createdate_product = ?";
            
            // Add size fields to update
            foreach ($size_fields as $field) {
                $update_sql .= ", $field = ?";
            }
            
            $update_sql .= " WHERE external_product_id = ?";
            
            $values = [
                $product['reference_product'] ?? null,
                $product['nom_product'] ?? '',
                $product['img_product'] ?? null,
                $product['img2_product'] ?? null,
                $product['img3_product'] ?? null,
                $product['img4_product'] ?? null,
                $product['img5_product'] ?? null,
                $product['description_product'] ?? null,
                $product['type_product'] ?? null,
                $product['category_product'] ?? null,
                $product['itemgroup_product'] ?? null,
                $product['price_product'] ?? null,
                $product['qnty_product'] ?? 0,
                $product['color_product'] ?? null,
                $product['collection_product'] ?? null,
                $product['status_product'] ?? 'active',
                $product['discount_product'] ?? 0.00,
                $product['AutoReapprovisionnement'] ?? 0,
                $product['AutoReapprovisionnement_quantity'] ?? 0,
                $product['AutoReapprovisionnement_quantity_sizes'] ?? null,
                $product['createdate_product'] ?? null
            ];
            
            // Add size values
            foreach ($size_fields as $field) {
                $values[] = $product[$field] ?? 0;
            }
            
            $values[] = $product['id_product'];
            
            $update_stmt = $conn->prepare($update_sql);
            $update_stmt->execute($values);
            $products_updated++;
        } else {
            // Insert new product
            $insert_sql = "INSERT INTO productions_products_lucci (
                external_product_id, reference_product, nom_product, img_product, img2_product,
                img3_product, img4_product, img5_product, description_product, type_product,
                category_product, itemgroup_product, price_product, qnty_product, color_product,
                collection_product, status_product, discount_product, AutoReapprovisionnement,
                AutoReapprovisionnement_quantity, AutoReapprovisionnement_quantity_sizes, createdate_product";
            
            // Add size fields to insert
            foreach ($size_fields as $field) {
                $insert_sql .= ", $field";
            }
            
            $insert_sql .= ", boutique_origin) VALUES (?" . str_repeat(', ?', 21 + count($size_fields)) . ", 'luccibyey')";
            
            $values = [
                $product['id_product'],
                $product['reference_product'] ?? null,
                $product['nom_product'] ?? '',
                $product['img_product'] ?? null,
                $product['img2_product'] ?? null,
                $product['img3_product'] ?? null,
                $product['img4_product'] ?? null,
                $product['img5_product'] ?? null,
                $product['description_product'] ?? null,
                $product['type_product'] ?? null,
                $product['category_product'] ?? null,
                $product['itemgroup_product'] ?? null,
                $product['price_product'] ?? null,
                $product['qnty_product'] ?? 0,
                $product['color_product'] ?? null,
                $product['collection_product'] ?? null,
                $product['status_product'] ?? 'active',
                $product['discount_product'] ?? 0.00,
                $product['AutoReapprovisionnement'] ?? 0,
                $product['AutoReapprovisionnement_quantity'] ?? 0,
                $product['AutoReapprovisionnement_quantity_sizes'] ?? null,
                $product['createdate_product'] ?? null
            ];
            
            // Add size values
            foreach ($size_fields as $field) {
                $values[] = $product[$field] ?? 0;
            }
            
            $insert_stmt = $conn->prepare($insert_sql);
            $insert_stmt->execute($values);
            $products_added++;
        }
        
        $products_processed++;
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Synchronisation réussie',
        'data' => [
            'total_products' => count($products),
            'processed' => $products_processed,
            'added' => $products_added,
            'updated' => $products_updated
        ]
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la synchronisation: ' . $e->getMessage()
    ]);
}
?>