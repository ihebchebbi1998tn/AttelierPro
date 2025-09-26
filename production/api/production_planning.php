<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$database = new Database();
$pdo = $database->getConnection();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        // Calculate material requirements and validate stock
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['product_id']) || !isset($input['planned_quantities'])) {
            throw new Exception('Product ID and planned quantities are required');
        }
        
        $product_id = $input['product_id'];
        $planned_quantities = $input['planned_quantities']; // Array like: {'s': 10, 'm': 15, 'l': 20} or {'total': 50}
        
        // Get configured materials for this product
        $materials_query = "
            SELECT 
                ppm.*,
                m.nom as material_name,
                m.description as material_description,
                m.couleur as material_color,
                m.quantite_stock as material_stock,
                m.quantite_min as min_stock,
                m.quantite_max as max_stock,
                qt.nom as quantity_unit
            FROM production_product_materials ppm
            JOIN production_matieres m ON ppm.material_id = m.id
            JOIN production_quantity_types qt ON m.quantity_type_id = qt.id
            WHERE ppm.product_id = ?
        ";
        
        $materials_stmt = $pdo->prepare($materials_query);
        $materials_stmt->execute([$product_id]);
        $configured_materials = $materials_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($configured_materials)) {
            throw new Exception('No materials configured for this product');
        }
        
        // Calculate total material requirements
        $material_requirements = [];
        $validation_results = [];
        
        foreach ($configured_materials as $material) {
            $material_id = $material['material_id'];
            $size_specific = $material['size_specific'];
            $quantity_per_unit = floatval($material['quantity_needed']);
            $material_stock = floatval($material['material_stock']);
            $min_stock = floatval($material['min_stock']);
            $max_stock = floatval($material['max_stock']);
            
            // Calculate stock status
            $stock_status = 'good';
            if ($material_stock <= $min_stock) {
                $stock_status = 'critical';
            } elseif ($material_stock <= $max_stock) {
                $stock_status = 'warning';
            }
            
            if (!isset($material_requirements[$material_id])) {
                $material_requirements[$material_id] = [
                    'material_name' => $material['material_name'],
                    'material_color' => $material['material_color'],
                    'quantity_unit' => $material['quantity_unit'],
                    'total_needed' => 0,
                    'current_stock' => $material_stock,
                    'min_stock' => $min_stock,
                    'max_stock' => $max_stock,
                    'stock_status' => $stock_status,
                    'size_breakdown' => []
                ];
            }
            
            // Determine planned quantity for this material/size
            $planned_qty = null;
            if (isset($planned_quantities[$size_specific])) {
                $planned_qty = intval($planned_quantities[$size_specific]);
            } elseif (isset($planned_quantities['none'])) {
                // Frontend no-size UI sends 'none' -> apply to any size_specific
                $planned_qty = intval($planned_quantities['none']);
            } elseif (isset($planned_quantities['total'])) {
                // Legacy support
                if ($size_specific === 'all') {
                    $planned_qty = intval($planned_quantities['total']);
                } else {
                    $planned_qty = intval($planned_quantities['total']);
                }
            }
            
            if ($planned_qty !== null && $planned_qty > 0) {
                $needed_qty = $planned_qty * $quantity_per_unit;
                
                $material_requirements[$material_id]['total_needed'] += $needed_qty;
                $material_requirements[$material_id]['size_breakdown'][] = [
                    'size' => $size_specific,
                    'planned_pieces' => $planned_qty,
                    'material_per_piece' => $quantity_per_unit,
                    'total_material_needed' => $needed_qty
                ];
            }
        }
        
        // Validate stock and create suggestions
        $has_sufficient_stock = true;
        $insufficient_materials = [];
        $max_possible_production = [];
        
        foreach ($material_requirements as $material_id => $requirement) {
            if ($requirement['total_needed'] > 0) {
                $stock_percentage = ($requirement['current_stock'] / $requirement['total_needed']) * 100;
            } else {
                $stock_percentage = 0; // nothing planned -> treat as insufficient to prompt correction
            }
            
            $material_requirements[$material_id]['stock_percentage'] = $stock_percentage;
            $material_requirements[$material_id]['is_sufficient'] = $stock_percentage >= 100;
            
            if ($stock_percentage < 100) {
                $has_sufficient_stock = false;
                $missing_quantity = max(0, $requirement['total_needed'] - $requirement['current_stock']);
                
                $insufficient_materials[] = [
                    'material_id' => $material_id,
                    'material_name' => $requirement['material_name'],
                    'material_color' => $requirement['material_color'],
                    'needed' => $requirement['total_needed'],
                    'available' => $requirement['current_stock'],
                    'missing' => $missing_quantity,
                    'unit' => $requirement['quantity_unit']
                ];
                
                // Calculate maximum possible production based on this material
                $max_pieces_for_material = [];
                foreach ($requirement['size_breakdown'] as $size_data) {
                    if ($size_data['material_per_piece'] > 0) {
                        $max_pieces = floor($requirement['current_stock'] / $size_data['material_per_piece']);
                        $max_pieces_for_material[$size_data['size']] = $max_pieces;
                    }
                }
                $max_possible_production[$material_id] = $max_pieces_for_material;
            }
        }
        
        // Calculate suggested production quantities that fit stock
        $suggested_quantities = [];
        $can_produce_any = false;
        
        if (!$has_sufficient_stock) {
            // Calculate suggested quantities per size based on material constraints
            foreach ($planned_quantities as $size => $planned_qty) {
                $min_possible_for_size = PHP_INT_MAX; // Start with max value
                $any_material_found = false;
                
                // Find the most limiting material for this size
                foreach ($material_requirements as $material_id => $requirement) {
                    foreach ($requirement['size_breakdown'] as $size_data) {
                        if ($size_data['size'] === $size && $size_data['material_per_piece'] > 0) {
                            $any_material_found = true;
                            $max_pieces_for_this_material = floor($requirement['current_stock'] / $size_data['material_per_piece']);
                            $min_possible_for_size = min($min_possible_for_size, $max_pieces_for_this_material);
                        }
                    }
                }
                
                // If no materials found for this size, set to 0
                if (!$any_material_found) {
                    $min_possible_for_size = 0;
                }
                
                // Ensure at least 0 pieces (never negative) 
                $suggested_qty = max(0, $min_possible_for_size === PHP_INT_MAX ? 0 : $min_possible_for_size);
                $suggested_quantities[$size] = $suggested_qty;
                
                // Check if we can produce at least 1 item of any size
                if ($suggested_qty > 0) {
                    $can_produce_any = true;
                }
            }
        }
        
        // Additional validation - check for unrealistic material quantities
        $validation_warnings = [];
        foreach ($material_requirements as $material_id => $requirement) {
            foreach ($requirement['size_breakdown'] as $size_data) {
                // Flag if material per piece seems excessive (adjust thresholds as needed)
                if ($size_data['material_per_piece'] > 1000 && strpos(strtolower($requirement['quantity_unit']), 'pièces') !== false) {
                    $validation_warnings[] = [
                        'type' => 'excessive_quantity',
                        'material' => $requirement['material_name'],
                        'quantity' => $size_data['material_per_piece'],
                        'unit' => $requirement['quantity_unit'],
                        'message' => "La quantité de {$requirement['material_name']} semble excessive ({$size_data['material_per_piece']} {$requirement['quantity_unit']} par pièce)"
                    ];
                }
            }
        }
        
        // Add impossibility warning if no production is possible
        if (!$has_sufficient_stock && !$can_produce_any) {
            $validation_warnings[] = [
                'type' => 'impossible_production',
                'material' => 'Tous les matériaux',
                'quantity' => 0,
                'unit' => 'pièces',
                'message' => "Production impossible : stock insuffisant pour produire même 1 seule pièce. Réapprovisionnement requis."
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'has_sufficient_stock' => $has_sufficient_stock,
                'material_requirements' => $material_requirements,
                'insufficient_materials' => $insufficient_materials,
                'suggested_quantities' => $suggested_quantities,
                'max_possible_production' => $max_possible_production,
                'planned_quantities' => $planned_quantities,
                'validation_warnings' => $validation_warnings ?? [],
                'can_produce_any' => $can_produce_any ?? true
            ]
        ]);
        
    } elseif ($method === 'GET') {
        // Get product info for production planning
        $product_id = $_GET['product_id'] ?? null;
        
        if (!$product_id) {
            throw new Exception('Product ID is required');
        }
        
        // Get product info
        $product_query = "SELECT * FROM production_ready_products WHERE id = ?";
        $product_stmt = $pdo->prepare($product_query);
        $product_stmt->execute([$product_id]);
        $product = $product_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            throw new Exception('Product not found');
        }
        
        // Get configured sizes
        $sizes_query = "SELECT * FROM product_sizes_config WHERE product_id = ?";
        $sizes_stmt = $pdo->prepare($sizes_query);
        $sizes_stmt->execute([$product_id]);
        $sizes_result = $sizes_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check if product has no sizes
        $has_no_sizes = false;
        // Prefer explicit flag if present
        $no_sizes_flag_query = "SELECT no_sizes FROM product_sizes_config WHERE product_id = ? LIMIT 1";
        $no_sizes_flag_stmt = $pdo->prepare($no_sizes_flag_query);
        $no_sizes_flag_stmt->execute([$product_id]);
        $no_sizes_flag_result = $no_sizes_flag_stmt->fetch(PDO::FETCH_ASSOC);
        if ($no_sizes_flag_result && intval($no_sizes_flag_result['no_sizes']) === 1) {
            $has_no_sizes = true;
        }
        // Also detect legacy marker rows like size_type = 'no_sizes' or size_value = 'none'
        if (!$has_no_sizes) {
            foreach ($sizes_result as $row) {
                if (strtolower($row['size_type']) === 'no_sizes' || strtolower($row['size_value']) === 'none') {
                    $has_no_sizes = true;
                    break;
                }
            }
        }
        
        // Organize sizes by type
        $configured_sizes = [];
        if (!$has_no_sizes && !empty($sizes_result)) {
            foreach ($sizes_result as $size) {
                if ($size['is_active'] == 1) {
                    if (!isset($configured_sizes[$size['size_type']])) {
                        $configured_sizes[$size['size_type']] = [];
                    }
                    $configured_sizes[$size['size_type']][] = $size['size_value'];
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'product' => $product,
                'configured_sizes' => $configured_sizes,
                'has_no_sizes' => $has_no_sizes
            ]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>