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
    
    if ($action === 'deduct_stock_sur_mesure') {
        $commande_id = $data['commande_id'] ?? null;
        $user_id = $data['user_id'] ?? 1; // Default user if not provided
        
        if (!$commande_id) {
            echo json_encode(['success' => false, 'message' => 'ID de commande requis']);
            exit;
        }
        
        try {
            // Begin transaction
            $db->beginTransaction();
            
            // Get materials configuration for this commande (only non-deducted materials)
            $stmt = $db->prepare(" 
                SELECT sm.*, m.quantite_stock, m.prix_unitaire, m.nom as material_name
                FROM production_surmesure_matieres sm
                JOIN production_matieres m ON sm.material_id = m.id
                WHERE sm.commande_id = ? AND sm.stock_deducted = 0
                FOR UPDATE
            ");
            $stmt->execute([$commande_id]);
            $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($materials)) {
                throw new Exception('Aucune matière configurée pour cette commande');
            }
            
            $transactions = [];
            
            foreach ($materials as $material) {
                $surmesure_item_id = $material['id'];
                $material_id = $material['material_id'];
                $quantity_needed = floatval($material['quantity_needed']);
                $current_stock = floatval($material['quantite_stock']);
                $unit_price = floatval($material['prix_unitaire']);
                $quantity_type_id = $material['quantity_type_id'];
                
                // Check if there's enough stock
                if ($current_stock < $quantity_needed) {
                    throw new Exception("Stock insuffisant pour {$material['material_name']}. Disponible: {$current_stock}, Requis: {$quantity_needed}");
                }
                
                // Calculate total cost
                $total_cost = $quantity_needed * $unit_price;
                
                // Deduct from stock
                $updateStmt = $db->prepare("
                    UPDATE production_matieres 
                    SET quantite_stock = quantite_stock - ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$quantity_needed, $material_id]);
                
                // Create transaction record
                $transactionStmt = $db->prepare("
                    INSERT INTO production_transactions_stock 
                    (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, reference_commande, notes, user_id, date_transaction)
                    VALUES (?, 'out', ?, ?, ?, ?, 'Commande sur mesure', ?, ?, ?, NOW())
                ");
                
                $notes = "Déduction automatique pour commande sur mesure - Matière: {$material['material_name']}";
                
                $transactionStmt->execute([
                    $material_id,
                    $quantity_needed,
                    $quantity_type_id,
                    $unit_price,
                    $total_cost,
                    $commande_id,
                    $notes,
                    $user_id
                ]);
                
                // Mark this specific sur mesure material row as deducted
                $markDeductedStmt = $db->prepare(" 
                    UPDATE production_surmesure_matieres 
                    SET stock_deducted = 1, updated_at = NOW()
                    WHERE id = ?
                ");
                $markDeductedStmt->execute([$surmesure_item_id]);
                
                $transactions[] = [
                    'material_id' => $material_id,
                    'material_name' => $material['material_name'],
                    'quantity_deducted' => $quantity_needed,
                    'total_cost' => $total_cost,
                    'new_stock' => $current_stock - $quantity_needed
                ];
            }
            
            // Commit transaction
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Stock déduit avec succès',
                'transactions' => $transactions
            ]);
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $db->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        
    } elseif ($action === 'restore_stock_sur_mesure') {
        $material_id = $data['material_id'] ?? null;
        $commande_id = $data['commande_id'] ?? null;
        $user_id = $data['user_id'] ?? 1;
        
        if (!$material_id || !$commande_id) {
            echo json_encode(['success' => false, 'message' => 'ID de matériau et commande requis']);
            exit;
        }
        
        try {
            // Begin transaction
            $db->beginTransaction();
            
            // Get the sur mesure material configuration that was deducted
            $stmt = $db->prepare("
                SELECT sm.*, m.quantite_stock, m.prix_unitaire, m.nom as material_name
                FROM production_surmesure_matieres sm
                JOIN production_matieres m ON sm.material_id = m.id
                WHERE sm.commande_id = ? AND sm.material_id = ? AND sm.stock_deducted = 1
            ");
            $stmt->execute([$commande_id, $material_id]);
            $materialConfig = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$materialConfig) {
                throw new Exception('Aucune déduction de stock trouvée pour ce matériau');
            }
            
            $quantity_to_restore = floatval($materialConfig['quantity_needed']);
            $unit_price = floatval($materialConfig['prix_unitaire']);
            $quantity_type_id = $materialConfig['quantity_type_id'];
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
                VALUES (?, 'in', ?, ?, ?, ?, 'Retour commande sur mesure', ?, ?, ?, NOW())
            ");
            
            $notes = "Retour automatique suite à suppression - Matière: {$materialConfig['material_name']}";
            
            $transactionStmt->execute([
                $material_id,
                $quantity_to_restore,
                $quantity_type_id,
                $unit_price,
                $total_cost,
                $commande_id,
                $notes,
                $user_id
            ]);
            
            // Mark material as no longer deducted
            $markRestoredStmt = $db->prepare("
                UPDATE production_surmesure_matieres 
                SET stock_deducted = 0, updated_at = NOW()
                WHERE commande_id = ? AND material_id = ?
            ");
            $markRestoredStmt->execute([$commande_id, $material_id]);
            
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
                    'material_name' => $materialConfig['material_name'],
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
        
    } elseif ($action === 'get_transactions') {
        $commande_id = $data['commande_id'] ?? null;
        
        try {
            $stmt = $db->prepare("
                SELECT t.*, m.nom as material_name, qt.nom as quantity_type_name, qt.unite
                FROM production_transactions_stock t
                LEFT JOIN production_matieres m ON t.material_id = m.id
                LEFT JOIN production_quantity_types qt ON t.quantity_type_id = qt.id
                WHERE t.reference_commande = ? AND t.motif = 'Commande sur mesure'
                ORDER BY t.date_transaction DESC
            ");
            $stmt->execute([$commande_id]);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $transactions
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all transactions
    try {
        $stmt = $db->prepare("
            SELECT t.*, m.nom as material_name, qt.nom as quantity_type_name, qt.unite, u.nom as user_name
            FROM production_transactions_stock t
            LEFT JOIN production_matieres m ON t.material_id = m.id
            LEFT JOIN production_quantity_types qt ON t.quantity_type_id = qt.id
            LEFT JOIN production_utilisateurs u ON t.user_id = u.id
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