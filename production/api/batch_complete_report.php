<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $batch_id = $_GET['batch_id'] ?? '';
    
    if (empty($batch_id)) {
        throw new Exception('Batch ID is required');
    }

    // First, get batch information with product details
    $batch_query = "
        SELECT pb.*, 
               pr.nom_product as nom_produit,
               pr.reference_product as ref_produit,
               pr.external_product_id,
               pr.img_product,
               pr.img2_product,
               pr.img3_product,
               pr.img4_product,
               pr.img5_product,
               pr.description_product as description,
               pr.price_product as prix_vente,
               pr.boutique_origin,
               pr.production_specifications
        FROM production_batches pb 
        LEFT JOIN production_ready_products pr ON pb.product_id = pr.id
        WHERE pb.batch_reference = ?
    ";
    
    $batch_stmt = $conn->prepare($batch_query);
    $batch_stmt->execute([$batch_id]);
    $batch = $batch_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$batch) {
        throw new Exception('Batch not found');
    }

    // Get materials used in this batch
    $materials_query = "
        SELECT ppm.*, pm.nom, pm.prix_unitaire, pm.description, pm.couleur,
               qt.nom as quantity_type_name, qt.unite as quantity_unit,
               ppm.commentaire,
               (COALESCE(ppm.quantity_needed, 0) * COALESCE(pm.prix_unitaire, 0)) as total_cost
        FROM production_product_materials ppm
        JOIN production_matieres pm ON ppm.material_id = pm.id
        LEFT JOIN production_quantity_types qt ON ppm.quantity_type_id = qt.id
        WHERE ppm.product_id = ?
    ";
    $materials_stmt = $conn->prepare($materials_query);
    $materials_stmt->execute([$batch['product_id']]);
    $materials = $materials_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add calculated fields and ensure proper field names for frontend compatibility
    foreach ($materials as &$material) {
        $material['nom_matiere'] = $material['nom']; // Frontend expects nom_matiere
        $material['quantity_used'] = $material['quantity_needed']; // Frontend expects quantity_used
        $material['unite_mesure'] = $material['quantity_unit']; // Frontend expects unite_mesure
        $material['material_description'] = $material['description']; // Frontend expects material_description
        $material['unit_cost'] = $material['prix_unitaire']; // Frontend expects unit_cost
        
        // Ensure couleur is available (already selected but make sure it's set)
        if (!isset($material['couleur'])) {
            $material['couleur'] = null;
        }
        
        // Ensure total_cost is always a number
        if (!isset($material['total_cost']) || !is_numeric($material['total_cost'])) {
            $material['total_cost'] = 0;
        }
    }

    // Get product images from production_ready_products (already captured at production start)
    // This ensures we show the images as they were when production was initiated
    $product_images = [];
    $image_fields = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
    
    foreach ($image_fields as $field) {
        if (!empty($batch[$field])) {
            $image_path = $batch[$field];
            
            // Check if it's already a full URL
            if (preg_match('/^https?:\/\//', $image_path)) {
                $product_images[] = $image_path;
            } else {
                // Clean the path by removing any leading slashes
                $cleanPath = ltrim($image_path, '/');
                
                // Ensure path starts with 'uploads/' if it doesn't already
                if (!preg_match('/^uploads\//', $cleanPath)) {
                    $cleanPath = 'uploads/' . $cleanPath;
                }
                
                // Build the full URL based on boutique origin
                if ($batch['boutique_origin'] === 'luccibyey') {
                    // Lucci By Ey: https://luccibyey.com.tn/api/uploads/filename
                    $full_url = "https://luccibyey.com.tn/api/" . $cleanPath;
                } else if ($batch['boutique_origin'] === 'spadadibattaglia') {
                    // Spada di Battaglia: https://spadadibattaglia.com/uploads/filename
                    $full_url = "https://spadadibattaglia.com/" . $cleanPath;
                } else {
                    $full_url = null;
                }
                
                if ($full_url) {
                    $product_images[] = $full_url;
                }
            }
        }
    }

    // Get product attachments
    $attachments = [];
    try {
        $attachments_query = "
            SELECT filename, original_filename, file_path, file_type, description, mime_type
            FROM production_products_attachments 
            WHERE product_id = ?
        ";
        $attachments_stmt = $conn->prepare($attachments_query);
        $attachments_stmt->execute([$batch['product_id']]);
        $attachments = $attachments_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $attachments = [];
    }

    // Get size configurations
    $size_configs = [];
    try {
        $size_config_query = "
            SELECT size_type, size_value, is_active, no_sizes
            FROM product_sizes_config
            WHERE product_id = ? AND is_active = 1
            ORDER BY id
        ";
        $size_config_stmt = $conn->prepare($size_config_query);
        $size_config_stmt->execute([$batch['product_id']]);
        $size_configs = $size_config_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $size_configs = [];
    }

    // Get material configurations
    $material_configs = [];
    try {
        $material_config_query = "
            SELECT pm.id, pm.nom, pm.prix_unitaire, pm.couleur, pm.description, pm.category_id,
                   pmc.nom as nom_category, ppm.quantity_needed, ppm.size
            FROM production_produit_matieres ppm
            JOIN production_matieres pm ON ppm.material_id = pm.id
            LEFT JOIN production_matieres_category pmc ON pm.category_id = pmc.id
            WHERE ppm.product_id = ?
        ";
        $material_config_stmt = $conn->prepare($material_config_query);
        $material_config_stmt->execute([$batch['product_id']]);
        $material_configs = $material_config_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $material_configs = [];
    }

    // Calculate totals using the correct field names
    $total_cost = 0;
    if (isset($batch['total_materials_cost']) && is_numeric($batch['total_materials_cost'])) {
        $total_cost = (float)$batch['total_materials_cost'];
    } else {
        // Calculate from materials if available
        foreach ($materials as $material) {
            if (isset($material['prix_unitaire']) && isset($material['quantity_needed']) && 
                is_numeric($material['prix_unitaire']) && is_numeric($material['quantity_needed'])) {
                $total_cost += (float)$material['prix_unitaire'] * (float)$material['quantity_needed'];
            }
        }
    }

    $batch_quantity = isset($batch['quantity_to_produce']) ? (int)$batch['quantity_to_produce'] : 0;
    $cost_per_unit = $batch_quantity > 0 ? $total_cost / $batch_quantity : 0;

    // Parse sizes breakdown from JSON if available
    $sizes_breakdown = [];
    if (isset($batch['sizes_breakdown']) && !empty($batch['sizes_breakdown'])) {
        $parsed_sizes = json_decode($batch['sizes_breakdown'], true);
        if ($parsed_sizes) {
            foreach ($parsed_sizes as $size => $quantity) {
                $sizes_breakdown[] = [
                    'size_name' => $size,
                    'quantity' => $quantity
                ];
            }
        }
    }

    // Get batch-specific images
    $batch_images = [];
    try {
        $batch_images_query = "
            SELECT image_id, file_path, description, upload_date 
            FROM production_images 
            WHERE related_type = 'batch' AND related_id = ?
            ORDER BY upload_date ASC
        ";
        $batch_images_stmt = $conn->prepare($batch_images_query);
        $batch_images_stmt->execute([$batch_id]);
        $batch_images_data = $batch_images_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($batch_images_data as $img) {
            $cleanPath = preg_replace('/^\/+/', '', $img['file_path']);
            $cleanPath = preg_replace('/^uploads\//', 'uploads/', $cleanPath);
            
            if (!preg_match('/^https?:\/\//', $cleanPath)) {
                $full_url = 'https://luccibyey.com.tn/production/' . $cleanPath;
            } else {
                $full_url = $cleanPath;
            }
            $batch_images[] = $full_url;
        }
    } catch (Exception $e) {
        $batch_images = [];
    }
    
    // Get batch-specific attachments
    $batch_attachments = [];
    try {
        $batch_attachments_query = "
            SELECT id, filename, original_filename, file_path, file_type, description, file_size, created_date
            FROM production_batch_attachments 
            WHERE batch_id = ?
            ORDER BY created_date DESC
        ";
        $batch_attachments_stmt = $conn->prepare($batch_attachments_query);
        $batch_attachments_stmt->execute([$batch_id]);
        $batch_attachments = $batch_attachments_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add full URLs for batch attachments
        foreach($batch_attachments as &$attachment) {
            $attachment['full_url'] = 'https://luccibyey.com.tn/production/' . $attachment['file_path'];
        }
    } catch (Exception $e) {
        $batch_attachments = [];
    }

    // Prepare product images (remove the old duplicate code)
    
    $response = [
        'success' => true,
        'data' => [
            'batch' => $batch,
            'sizes_breakdown' => $sizes_breakdown,
            'materials_used' => $materials,
            'product_attachments' => $attachments,
            'size_configurations' => $size_configs,
            'material_configurations' => $material_configs,
            'product_images' => $product_images,
            'batch_images' => $batch_images,
            'batch_attachments' => $batch_attachments,
            'financial_summary' => [
                'total_material_cost' => $total_cost,
                'cost_per_unit' => $cost_per_unit,
                'total_units' => $batch_quantity
            ]
        ]
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
}
?>