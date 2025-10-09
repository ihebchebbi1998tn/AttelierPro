<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Données JSON invalides']);
        exit;
    }
    
        $action = $data['action'] ?? '';
        $product_type = $data['product_type'] ?? 'regular';
    
    if ($action === 'deduct_stock_with_actual_quantities') {
        // New action: Deduct stock using actual material quantities filled by user
        $batch_id = $data['batch_id'] ?? null;
        $materials_quantities = $data['materials_quantities'] ?? [];
        $production_number = $data['production_number'] ?? null;
        $user_id = $data['user_id'] ?? 1;
        
        if (!$batch_id || empty($materials_quantities)) {
            echo json_encode(['success' => false, 'message' => 'Batch ID et quantités matériaux requis']);
            exit;
        }
        
        try {
            // Begin transaction
            $db->beginTransaction();
            
            // Get batch details to retrieve quantity_to_produce
            $batchStmt = $db->prepare("SELECT quantity_to_produce FROM production_batches WHERE id = ?");
            $batchStmt->execute([$batch_id]);
            $batchData = $batchStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$batchData) {
                throw new Exception("Batch ID {$batch_id} introuvable");
            }
            
            $quantity_to_produce = intval($batchData['quantity_to_produce']);
            
            if ($quantity_to_produce <= 0) {
                throw new Exception("Quantité à produire invalide pour le batch {$batch_id}");
            }
            
            $transactions = [];
            $totalCost = 0;
            $processedMaterials = [];
            
            foreach ($materials_quantities as $material_id => $quantity_per_piece) {
                $material_id = intval($material_id);
                $quantity_per_piece = floatval($quantity_per_piece);
                
                // Skip if quantity is 0 or negative
                if ($quantity_per_piece <= 0) {
                    continue;
                }
                
                // Skip if already processed
                if (isset($processedMaterials[$material_id])) {
                    continue;
                }
                
                // IMPORTANT: Multiply quantity per piece by total units to produce
                $quantity_to_deduct = $quantity_per_piece * $quantity_to_produce;
                
                // Get material details
                $stmt = $db->prepare("
                    SELECT m.*, qt.nom as quantity_type_name, qt.unite, qt.id as quantity_type_id
                    FROM production_matieres m
                    LEFT JOIN production_quantity_types qt ON m.quantity_type_id = qt.id
                    WHERE m.id = ?
                    FOR UPDATE
                ");
                $stmt->execute([$material_id]);
                $material = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$material) {
                    throw new Exception("Matériau ID {$material_id} introuvable");
                }
                
                $current_stock = floatval($material['quantite_stock']);
                $unit_price = floatval($material['prix_unitaire']);
                
                // Check if there's enough stock
                if ($current_stock < $quantity_to_deduct) {
                    throw new Exception("Stock insuffisant pour {$material['nom']} ({$material['couleur']}). Disponible: {$current_stock} {$material['unite']}, Requis: {$quantity_to_deduct} {$material['unite']} (= {$quantity_per_piece} par pièce × {$quantity_to_produce} unités)");
                }
                
                // Calculate total cost
                $material_total_cost = $quantity_to_deduct * $unit_price;
                $totalCost += $material_total_cost;
                
                // Deduct from stock
                $updateStmt = $db->prepare("
                    UPDATE production_matieres 
                    SET quantite_stock = quantite_stock - ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$quantity_to_deduct, $material_id]);
                
                // Create transaction record
                $transactionStmt = $db->prepare("
                    INSERT INTO production_transactions_stock 
                    (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, reference_commande, notes, user_id, date_transaction)
                    VALUES (?, 'out', ?, ?, ?, ?, 'Production', ?, ?, ?, NOW())
                ");
                
                $reference = $production_number ?? "BATCH-{$batch_id}";
                $notes = "Déduction stock pour production - Lot: {$reference}, Matière: {$material['nom']} ({$material['couleur']}), Quantité par pièce: {$quantity_per_piece} {$material['unite']}, Unités produites: {$quantity_to_produce}, Total déduit: {$quantity_to_deduct} {$material['unite']}";
                
                $transactionStmt->execute([
                    $material_id,
                    $quantity_to_deduct,
                    $material['quantity_type_id'],
                    $unit_price,
                    $material_total_cost,
                    $reference,
                    $notes,
                    $user_id
                ]);
                
                // Mark as processed
                $processedMaterials[$material_id] = true;
                
                // Calculate new stock
                $new_stock = $current_stock - $quantity_to_deduct;
                
                $transactions[] = [
                    'material_id' => $material_id,
                    'material_name' => $material['nom'],
                    'material_color' => $material['couleur'],
                    'quantity_per_piece' => $quantity_per_piece,
                    'units_produced' => $quantity_to_produce,
                    'quantity_deducted' => $quantity_to_deduct,
                    'unit' => $material['unite'],
                    'unit_price' => $unit_price,
                    'total_cost' => $material_total_cost,
                    'new_stock' => $new_stock
                ];
            }
            
            // Commit transaction
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock déduit avec succès selon les quantités réelles utilisées',
                'transactions' => $transactions,
                'total_cost' => $totalCost
            ]);
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $db->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        
    } elseif ($action === 'deduct_stock_production') {
        $product_id = $data['product_id'] ?? null;
        $planned_quantities = $data['planned_quantities'] ?? [];
        $production_batch_id = $data['production_batch_id'] ?? null;
        $production_number = $data['production_number'] ?? null;
        $user_id = $data['user_id'] ?? 1;
        
        if (!$product_id || empty($planned_quantities)) {
            echo json_encode(['success' => false, 'message' => 'ID produit et quantités planifiées requis']);
            exit;
        }
        
        try {
            // Begin transaction
            $db->beginTransaction();
            
            // Get material configuration for this product
            $materials_table = ($product_type === 'soustraitance') ? 'production_soustraitance_product_materials' : 'production_product_materials';
            $stmt = $db->prepare("
                SELECT pm.*, m.quantite_stock, m.prix_unitaire, m.nom as material_name, m.couleur, 
                       qt.nom as quantity_type_name, qt.unite
                FROM {$materials_table} pm
                JOIN production_matieres m ON pm.material_id = m.id
                LEFT JOIN production_quantity_types qt ON pm.quantity_type_id = qt.id
                WHERE pm.product_id = ?
                FOR UPDATE
            ");
            $stmt->execute([$product_id]);
            $materialConfigs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($materialConfigs)) {
                throw new Exception('Aucune configuration de matériau trouvée pour ce produit');
            }
            
            $transactions = [];
            $totalCost = 0;
            $materialStocks = []; // Track stock levels per material
            $processedMaterials = []; // Track processed materials to avoid duplicates
            
            foreach ($materialConfigs as $config) {
                $material_id = $config['material_id'];
                
                // Skip if this material has already been processed to avoid duplicates
                $material_key = $material_id . '_' . ($config['size_specific'] ?? 'none');
                if (isset($processedMaterials[$material_key])) {
                    continue;
                }
                
                $material_per_piece = floatval($config['quantity_needed']);
                $current_stock = floatval($config['quantite_stock']);
                $unit_price = floatval($config['prix_unitaire']);
                
                // Initialize or get current stock level for this material
                if (!isset($materialStocks[$material_id])) {
                    $materialStocks[$material_id] = $current_stock;
                }
                $current_stock = $materialStocks[$material_id];
                $quantity_type_id = $config['quantity_type_id'];
                $size_specific = $config['size_specific'];
                
                // Calculate total material needed based on planned quantities
                $total_material_needed = 0;
                
                if ($size_specific && $size_specific !== 'none') {
                    // Try exact match first, then lowercase version
                    $pieces_for_size = 0;
                    if (isset($planned_quantities[$size_specific])) {
                        $pieces_for_size = intval($planned_quantities[$size_specific]);
                    } elseif (isset($planned_quantities[strtolower($size_specific)])) {
                        $pieces_for_size = intval($planned_quantities[strtolower($size_specific)]);
                    }
                    
                    if ($pieces_for_size > 0) {
                        $total_material_needed = $pieces_for_size * $material_per_piece;
                    }
                } elseif ($size_specific === 'none' || !$size_specific) {
                    // Material for all sizes or no specific size
                    $total_pieces = array_sum(array_map('intval', $planned_quantities));
                    $total_material_needed = $total_pieces * $material_per_piece;
                } else {
                    // This material config doesn't match any planned size, skip
                    continue;
                }
                
                // Skip if no material needed
                if ($total_material_needed <= 0) {
                    continue;
                }
                
                // Check if there's enough stock
                if ($current_stock < $total_material_needed) {
                    throw new Exception("Stock insuffisant pour {$config['material_name']} ({$config['couleur']}). Disponible: {$current_stock} {$config['unite']}, Requis: {$total_material_needed} {$config['unite']}");
                }
                
                // Calculate total cost for this material
                $material_total_cost = $total_material_needed * $unit_price;
                $totalCost += $material_total_cost;
                
                // Deduct from stock
                $updateStmt = $db->prepare("
                    UPDATE production_matieres 
                    SET quantite_stock = quantite_stock - ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$total_material_needed, $material_id]);
                
                // Create transaction record
                $transactionStmt = $db->prepare("
                    INSERT INTO production_transactions_stock 
                    (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, reference_commande, notes, user_id, date_transaction)
                    VALUES (?, 'out', ?, ?, ?, ?, 'Production', ?, ?, ?, NOW())
                ");
                
                // Use production batch ID or number as reference, fallback to product ID
                $reference = $production_batch_id ?? $production_number ?? "PROD-{$product_id}";
                
                // Enhanced notes with production details
                $planned_quantities_str = implode(', ', array_map(function($size, $qty) {
                    return "$size: $qty pcs"; 
                }, array_keys($planned_quantities), $planned_quantities));
                
                $notes = "Déduction stock pour production - Lot: {$reference}, Produit ID: {$product_id}, Matière: {$config['material_name']} ({$config['couleur']}), Quantités planifiées: [{$planned_quantities_str}]";
                
                $transactionStmt->execute([
                    $material_id,
                    $total_material_needed,
                    $quantity_type_id,
                    $unit_price,
                    $material_total_cost,
                    $reference,
                    $notes,
                    $user_id
                ]);
                
                // Update the tracked stock level
                $materialStocks[$material_id] -= $total_material_needed;
                
                // Mark this material configuration as processed
                $processedMaterials[$material_key] = true;
                
                $transactions[] = [
                    'material_id' => $material_id,
                    'material_name' => $config['material_name'],
                    'material_color' => $config['couleur'],
                    'quantity_deducted' => $total_material_needed,
                    'unit' => $config['unite'],
                    'unit_price' => $unit_price,
                    'total_cost' => $material_total_cost,
                    'new_stock' => $materialStocks[$material_id],
                    'size_specific' => $size_specific
                ];
            }
            
            // Commit transaction
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock déduit avec succès pour la production',
                'transactions' => $transactions,
                'total_cost' => $totalCost
            ]);
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $db->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        
    } elseif ($action === 'get_production_transactions') {
        $reference = $data['reference'] ?? $data['product_id'] ?? null;
        
        try {
            $stmt = $db->prepare("
                SELECT t.*, m.nom as material_name, qt.nom as quantity_type_name, qt.unite
                FROM production_transactions_stock t
                LEFT JOIN production_matieres m ON t.material_id = m.id
                LEFT JOIN production_quantity_types qt ON t.quantity_type_id = qt.id
                WHERE t.reference_commande = ? AND (t.motif = 'Production' OR t.motif = 'Production produit')
                ORDER BY t.date_transaction DESC
            ");
            $stmt->execute([$reference]);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $transactions
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'restore_stock_production') {
        $material_id = $data['material_id'] ?? null;
        $product_id = $data['product_id'] ?? null;
        $user_id = $data['user_id'] ?? 1;
        
        if (!$material_id || !$product_id) {
            echo json_encode(['success' => false, 'message' => 'ID de matériau et produit requis']);
            exit;
        }
        
        try {
            // Begin transaction
            $db->beginTransaction();
            
            // Get the last deduction transaction for this material and product
            $stmt = $db->prepare("
                SELECT t.*, m.nom as material_name
                FROM production_transactions_stock t
                JOIN production_matieres m ON t.material_id = m.id
                WHERE t.material_id = ? AND t.reference_commande = ? 
                  AND t.motif = 'Production produit' AND t.type_mouvement = 'out'
                ORDER BY t.date_transaction DESC
                LIMIT 1
            ");
            $stmt->execute([$material_id, $product_id]);
            $lastTransaction = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$lastTransaction) {
                throw new Exception('Aucune déduction trouvée pour ce matériau et produit');
            }
            
            $quantity_to_restore = floatval($lastTransaction['quantite']);
            $unit_price = floatval($lastTransaction['prix_unitaire']);
            $quantity_type_id = $lastTransaction['quantity_type_id'];
            $total_cost = $quantity_to_restore * $unit_price;
            
            // Add back to stock
            $updateStmt = $db->prepare("
                UPDATE production_matieres 
                SET quantite_stock = quantite_stock + ?
                WHERE id = ?
            ");
            $updateStmt->execute([$quantity_to_restore, $material_id]);
            
            // Create transaction record (stock IN)
            $transactionStmt = $db->prepare("
                INSERT INTO production_transactions_stock 
                (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, reference_commande, notes, user_id, date_transaction)
                VALUES (?, 'in', ?, ?, ?, ?, 'Retour Production', ?, ?, ?, NOW())
            ");
            
            $notes = "Retour stock suite à annulation production - Matière: {$lastTransaction['material_name']}, Quantité restaurée: {$quantity_to_restore}";
            
            $transactionStmt->execute([
                $material_id,
                $quantity_to_restore,
                $quantity_type_id,
                $unit_price,
                $total_cost,
                $product_id,
                $notes,
                $user_id
            ]);
            
            // Commit transaction
            $db->commit();
            
            // Get updated stock
            $newStockStmt = $db->prepare("SELECT quantite_stock FROM production_matieres WHERE id = ?");
            $newStockStmt->execute([$material_id]);
            $newStock = $newStockStmt->fetchColumn();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock restauré avec succès',
                'restoration' => [
                    'material_id' => $material_id,
                    'material_name' => $lastTransaction['material_name'],
                    'quantity_restored' => $quantity_to_restore,
                    'total_cost' => $total_cost,
                    'new_stock' => floatval($newStock)
                ]
            ]);
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $db->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all production transactions
    try {
        $stmt = $db->prepare("
            SELECT t.*, m.nom as material_name, qt.nom as quantity_type_name, qt.unite, u.nom as user_name
            FROM production_transactions_stock t
            LEFT JOIN production_matieres m ON t.material_id = m.id
            LEFT JOIN production_quantity_types qt ON t.quantity_type_id = qt.id
            LEFT JOIN production_utilisateurs u ON t.user_id = u.id
            WHERE t.motif IN ('Production', 'Production produit', 'Retour Production', 'Retour production')
            ORDER BY t.date_transaction DESC
        ");
        $stmt->execute();
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $transactions
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
}
?>