<?php
// Enable error reporting (for debugging only – disable in production!)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['material_id'])) {
            // Get transactions for a specific material
            $stmt = $db->prepare("
                SELECT t.*, m.nom AS material_title, m.couleur AS material_color, 
                       u.nom AS user_name
                FROM production_transactions_stock t
                JOIN production_matieres m ON t.material_id = m.id
                JOIN production_utilisateurs u ON t.user_id = u.id
                WHERE t.material_id = ?
                ORDER BY t.date_transaction DESC
            ");
            $stmt->execute([$_GET['material_id']]);
            $transactions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $transactions]);

        } elseif(isset($_GET['type'])) {
            // Get transactions by type (in/out)
            $stmt = $db->prepare("
                SELECT t.*, m.nom AS material_title, m.couleur AS material_color,
                       u.nom AS user_name
                FROM production_transactions_stock t
                JOIN production_matieres m ON t.material_id = m.id
                JOIN production_utilisateurs u ON t.user_id = u.id
                WHERE t.type_mouvement = ?
                ORDER BY t.date_transaction DESC
            ");
            $stmt->execute([$_GET['type']]);
            $transactions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $transactions]);

        } elseif(isset($_GET['recent'])) {
            // Get recent transactions (last 30 days)
            $stmt = $db->query("
                SELECT t.*, m.nom AS material_title, m.couleur AS material_color,
                       u.nom AS user_name
                FROM production_transactions_stock t
                JOIN production_matieres m ON t.material_id = m.id
                JOIN production_utilisateurs u ON t.user_id = u.id
                WHERE t.date_transaction >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ORDER BY t.date_transaction DESC
            ");
            $transactions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $transactions]);

        } else {
            // Get all transactions with pagination
            $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
            
            $stmt = $db->prepare("
                SELECT t.*, m.nom AS material_title, m.couleur AS material_color,
                       u.nom AS user_name,
                       mc.nom AS category_name
                FROM production_transactions_stock t
                JOIN production_matieres m ON t.material_id = m.id
                LEFT JOIN production_matieres_category mc ON m.category_id = mc.id
                JOIN production_utilisateurs u ON t.user_id = u.id
                ORDER BY t.date_transaction DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $transactions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $transactions]);
        }
        break;

    case 'POST':
        // Handle special production actions
        if(isset($input['action'])) {
            switch($input['action']) {
                case 'startProduction':
                    echo json_encode(startProduction($db, $input['product_id'], $input['quantity'], $input['user_id']));
                    break;
                case 'startCommandeSurMesure':
                    echo json_encode(startCommandeSurMesure($db, $input['order_id'], $input['user_id']));
                    break;
                case 'cancelTransaction':
                    echo json_encode(cancelTransaction($db, $input['transaction_id'], $input['user_id']));
                    break;
                default:
                    echo json_encode(['success' => false, 'message' => 'Unknown action']);
            }
        } else {
            // Create new transaction and update material quantity
            try {
                $db->beginTransaction();

                // Insert transaction
                $stmt = $db->prepare("
                    INSERT INTO production_transactions_stock 
                    (material_id, type_mouvement, quantite, prix_unitaire, cout_total, motif, user_id, date_transaction) 
                    VALUES (?, ?, ?, 0, 0, ?, ?, NOW())
                ");
                $result = $stmt->execute([
                    $input['material_id'],
                    $input['type'],
                    $input['quantity'],
                    'Manual transaction',
                    $input['user_id']
                ]);
                
                if($result) {
                    // Update material quantity
                    if($input['type'] === 'in') {
                        $stmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock + ? WHERE id = ?");
                    } else {
                        $stmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock - ? WHERE id = ?");
                    }
                    $stmt->execute([$input['quantity'], $input['material_id']]);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Transaction created successfully', 'id' => $db->lastInsertId()]);
                } else {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Error creating transaction']);
                }
            } catch(Exception $e) {
                $db->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Update transaction (⚠ not recommended for stock integrity)
        $stmt = $db->prepare("
            UPDATE production_transactions_stock 
            SET material_id=?, type_mouvement=?, quantite=?, related_order_id=?, user_id=? 
            WHERE transaction_id=?
        ");
        $result = $stmt->execute([
            $input['material_id'],
            $input['type'],
            $input['quantity'],
            $input['related_order_id'] ?? null,
            $input['user_id'],
            $input['transaction_id']
        ]);
        
        echo json_encode($result
            ? ['success' => true, 'message' => 'Transaction updated successfully']
            : ['success' => false, 'message' => 'Error updating transaction']
        );
        break;

    case 'DELETE':
        // Delete transaction (⚠ not recommended for audit trail)
        $stmt = $db->prepare("DELETE FROM production_transactions_stock WHERE transaction_id = ?");
        $result = $stmt->execute([$input['transaction_id']]);
        
        echo json_encode($result
            ? ['success' => true, 'message' => 'Transaction deleted successfully']
            : ['success' => false, 'message' => 'Error deleting transaction']
        );
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

// ============= PRODUCTION MANAGEMENT FUNCTIONS =============

function startProduction($db, $product_id, $quantity, $user_id) {
    try {
        $db->beginTransaction();

        // Get required materials for the product
        $stmt = $db->prepare("
            SELECT pm.material_id, pm.quantity_needed, m.quantity_total, m.title AS material_title,
                   m.lowest_quantity_needed, m.medium_quantity_needed
            FROM production_produit_matieres pm
            JOIN production_matieres m ON pm.material_id = m.material_id
            WHERE pm.product_id = ?
        ");
        $stmt->execute([$product_id]);
        $materials = $stmt->fetchAll();
        
        if(!$materials) {
            $db->rollBack();
            return ['success' => false, 'message' => 'No materials found for this product'];
        }
        
        $alerts = [];
        $insufficient_stock = [];
        
        // Check stock availability
        foreach($materials as $material) {
            $required_quantity = $material['quantity_needed'] * $quantity;
            
            if($material['quantity_total'] < $required_quantity) {
                $insufficient_stock[] = [
                    'material_title' => $material['material_title'],
                    'required' => $required_quantity,
                    'available' => $material['quantity_total']
                ];
            }
            
            $remaining_stock = $material['quantity_total'] - $required_quantity;
            if($remaining_stock < $material['lowest_quantity_needed']) {
                $alerts[] = [
                    'type' => 'critical',
                    'material_title' => $material['material_title'],
                    'remaining_stock' => $remaining_stock,
                    'threshold' => $material['lowest_quantity_needed']
                ];
            } elseif($remaining_stock < $material['medium_quantity_needed']) {
                $alerts[] = [
                    'type' => 'warning',
                    'material_title' => $material['material_title'],
                    'remaining_stock' => $remaining_stock,
                    'threshold' => $material['medium_quantity_needed']
                ];
            }
        }
        
        if(!empty($insufficient_stock)) {
            $db->rollBack();
            return ['success' => false, 'message' => 'Insufficient stock for production', 'insufficient_stock' => $insufficient_stock];
        }
        
        // Create transactions and update stock
        $transaction_ids = [];
        foreach($materials as $material) {
            $required_quantity = $material['quantity_needed'] * $quantity;
            
            $stmt = $db->prepare("
                INSERT INTO production_transactions_stock 
                (material_id, type_mouvement, quantite, related_product_id, user_id, date_transaction) 
                VALUES (?, 'out', ?, ?, ?, NOW())
            ");
            $stmt->execute([$material['material_id'], $required_quantity, $product_id, $user_id]);
            $transaction_ids[] = $db->lastInsertId();
            
            $stmt = $db->prepare("UPDATE production_matieres SET quantity_total = quantity_total - ? WHERE material_id = ?");
            $stmt->execute([$required_quantity, $material['material_id']]);
        }
        
        $db->commit();
        return ['success' => true, 'message' => 'Production started successfully', 'transaction_ids' => $transaction_ids, 'alerts' => $alerts];
        
    } catch(Exception $e) {
        $db->rollBack();
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

function startCommandeSurMesure($db, $order_id, $user_id) {
    try {
        $db->beginTransaction();

        $stmt = $db->prepare("
            SELECT o.*, p.product_id, p.title AS product_title
            FROM production_commandes_surmesure o
            LEFT JOIN production_produits p ON JSON_EXTRACT(o.other_attributes, '$.product_id') = p.product_id
            WHERE o.order_id = ?
        ");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch();
        
        if(!$order) {
            $db->rollBack();
            return ['success' => false, 'message' => 'Order not found'];
        }
        if(!$order['product_id']) {
            $db->rollBack();
            return ['success' => false, 'message' => 'No product specified for this custom order'];
        }
        
        $stmt = $db->prepare("
            SELECT pm.material_id, pm.quantity_needed, m.quantity_total, m.title AS material_title,
                   m.lowest_quantity_needed, m.medium_quantity_needed
            FROM production_produit_matieres pm
            JOIN production_matieres m ON pm.material_id = m.material_id
            WHERE pm.product_id = ?
        ");
        $stmt->execute([$order['product_id']]);
        $materials = $stmt->fetchAll();
        
        if(!$materials) {
            $db->rollBack();
            return ['success' => false, 'message' => 'No materials found for this product'];
        }
        
        $alerts = [];
        $insufficient_stock = [];
        
        foreach($materials as $material) {
            $required_quantity = $material['quantity_needed'];
            
            if($material['quantity_total'] < $required_quantity) {
                $insufficient_stock[] = [
                    'material_title' => $material['material_title'],
                    'required' => $required_quantity,
                    'available' => $material['quantity_total']
                ];
            }
            
            $remaining_stock = $material['quantity_total'] - $required_quantity;
            if($remaining_stock < $material['lowest_quantity_needed']) {
                $alerts[] = [
                    'type' => 'critical',
                    'material_title' => $material['material_title'],
                    'remaining_stock' => $remaining_stock,
                    'threshold' => $material['lowest_quantity_needed']
                ];
            } elseif($remaining_stock < $material['medium_quantity_needed']) {
                $alerts[] = [
                    'type' => 'warning',
                    'material_title' => $material['material_title'],
                    'remaining_stock' => $remaining_stock,
                    'threshold' => $material['medium_quantity_needed']
                ];
            }
        }
        
        if(!empty($insufficient_stock)) {
            $db->rollBack();
            return ['success' => false, 'message' => 'Insufficient stock for custom order production', 'insufficient_stock' => $insufficient_stock];
        }
        
        $transaction_ids = [];
        foreach($materials as $material) {
            $required_quantity = $material['quantity_needed'];
            
            $stmt = $db->prepare("
                INSERT INTO production_transactions_stock 
                (material_id, type_mouvement, quantite, related_order_id, user_id, date_transaction) 
                VALUES (?, 'out', ?, ?, ?, NOW())
            ");
            $stmt->execute([$material['material_id'], $required_quantity, $order_id, $user_id]);
            $transaction_ids[] = $db->lastInsertId();
            
            $stmt = $db->prepare("UPDATE production_matieres SET quantity_total = quantity_total - ? WHERE material_id = ?");
            $stmt->execute([$required_quantity, $material['material_id']]);
        }
        
        $stmt = $db->prepare("UPDATE production_commandes_surmesure SET status = 'in_production', modified_date = NOW() WHERE order_id = ?");
        $stmt->execute([$order_id]);
        
        $db->commit();
        return ['success' => true, 'message' => 'Custom order production started successfully', 'transaction_ids' => $transaction_ids, 'alerts' => $alerts];
        
    } catch(Exception $e) {
        $db->rollBack();
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

function cancelTransaction($db, $transaction_id, $user_id) {
    try {
        $db->beginTransaction();

        // Get the transaction details
        $stmt = $db->prepare("
            SELECT t.*, m.nom AS material_title
            FROM production_transactions_stock t
            JOIN production_matieres m ON t.material_id = m.id
            WHERE t.transaction_id = ?
        ");
        $stmt->execute([$transaction_id]);
        $transaction = $stmt->fetch();
        
        if(!$transaction) {
            $db->rollBack();
            return ['success' => false, 'message' => 'Transaction not found'];
        }

        // Check if already cancelled
        if(isset($transaction['is_cancelled']) && $transaction['is_cancelled'] == 1) {
            $db->rollBack();
            return ['success' => false, 'message' => 'Transaction already cancelled'];
        }

        // Reverse the stock movement
        if($transaction['type_mouvement'] === 'out') {
            // For OUT transactions (sortie), add stock back
            $stmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock + ? WHERE id = ?");
        } else {
            // For IN transactions (entrée), deduct stock
            $stmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock - ? WHERE id = ?");
        }
        $stmt->execute([$transaction['quantite'], $transaction['material_id']]);

        // Mark transaction as cancelled
        $stmt = $db->prepare("
            UPDATE production_transactions_stock 
            SET notes = CONCAT(COALESCE(notes, ''), ' [ANNULÉE]'),
                motif = CONCAT(COALESCE(motif, ''), ' - Annulée par utilisateur #', ?)
            WHERE transaction_id = ?
        ");
        $stmt->execute([$user_id, $transaction_id]);

        // Create a reversal transaction
        $reversal_type = $transaction['type_mouvement'] === 'out' ? 'in' : 'out';
        $stmt = $db->prepare("
            INSERT INTO production_transactions_stock 
            (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, reference_commande, notes, user_id, date_transaction) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $transaction['material_id'],
            $reversal_type,
            $transaction['quantite'],
            $transaction['quantity_type_id'],
            $transaction['prix_unitaire'],
            $transaction['cout_total'],
            'Annulation transaction #' . $transaction_id,
            $transaction['reference_commande'],
            'Transaction inverse suite à l\'annulation de la transaction #' . $transaction_id . ' (' . $transaction['material_title'] . ')',
            $user_id
        ]);

        $db->commit();
        return [
            'success' => true, 
            'message' => 'Transaction annulée avec succès. Stock restauré.',
            'reversal_transaction_id' => $db->lastInsertId()
        ];
        
    } catch(Exception $e) {
        $db->rollBack();
        return ['success' => false, 'message' => 'Erreur: ' . $e->getMessage()];
    }
}
?>
