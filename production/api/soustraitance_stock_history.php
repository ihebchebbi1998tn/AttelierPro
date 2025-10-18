<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                // Get history for specific product
                $productId = $_GET['product_id'];
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
                $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
                
                $stmt = $pdo->prepare("
                    SELECT 
                        h.*,
                        p.nom_product,
                        p.reference_product,
                        (h.new_quantity - h.old_quantity) as quantity_change
                    FROM production_soustraitance_stock_history h
                    JOIN production_soustraitance_products p ON h.product_id = p.id
                    WHERE h.product_id = ?
                    ORDER BY h.change_date DESC
                    LIMIT ? OFFSET ?
                ");
                $stmt->execute([$productId, $limit, $offset]);
                $history = $stmt->fetchAll();
                
                // Get total count
                $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM production_soustraitance_stock_history WHERE product_id = ?");
                $countStmt->execute([$productId]);
                $total = $countStmt->fetchColumn();
                
                echo json_encode([
                    'success' => true,
                    'data' => $history,
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]);
                
            } elseif (isset($_GET['stock_id'])) {
                // Get history for specific stock entry
                $stockId = $_GET['stock_id'];
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
                $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
                
                $stmt = $pdo->prepare("
                    SELECT 
                        h.*,
                        p.nom_product,
                        p.reference_product,
                        (h.new_quantity - h.old_quantity) as quantity_change
                    FROM production_soustraitance_stock_history h
                    JOIN production_soustraitance_products p ON h.product_id = p.id
                    WHERE h.stock_id = ?
                    ORDER BY h.change_date DESC
                    LIMIT ? OFFSET ?
                ");
                $stmt->execute([$stockId, $limit, $offset]);
                $history = $stmt->fetchAll();
                
                // Get total count
                $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM production_soustraitance_stock_history WHERE stock_id = ?");
                $countStmt->execute([$stockId]);
                $total = $countStmt->fetchColumn();
                
                echo json_encode([
                    'success' => true,
                    'data' => $history,
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]);
                
            } else {
                // Get recent history across all products
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
                $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
                
                $stmt = $pdo->prepare("
                    SELECT 
                        h.*,
                        p.nom_product,
                        p.reference_product,
                        c.name as client_name,
                        (h.new_quantity - h.old_quantity) as quantity_change
                    FROM production_soustraitance_stock_history h
                    JOIN production_soustraitance_products p ON h.product_id = p.id
                    LEFT JOIN production_soustraitance_clients c ON p.client_id = c.id
                    ORDER BY h.change_date DESC
                    LIMIT ? OFFSET ?
                ");
                $stmt->execute([$limit, $offset]);
                $history = $stmt->fetchAll();
                
                // Get summary stats
                $summaryStmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as total_changes,
                        COUNT(DISTINCT h.product_id) as products_affected,
                        COUNT(CASE WHEN h.change_type = 'ADD' THEN 1 END) as additions,
                        COUNT(CASE WHEN h.change_type = 'REMOVE' THEN 1 END) as removals,
                        COUNT(CASE WHEN h.change_type = 'ADJUST' THEN 1 END) as adjustments,
                        COUNT(CASE WHEN h.change_type = 'RESERVE' THEN 1 END) as reservations,
                        COUNT(CASE WHEN h.change_type = 'RELEASE' THEN 1 END) as releases,
                        DATE(MAX(h.change_date)) as last_change_date
                    FROM production_soustraitance_stock_history h
                    WHERE h.change_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ");
                $summaryStmt->execute();
                $summary = $summaryStmt->fetch();
                
                echo json_encode([
                    'success' => true,
                    'data' => $history,
                    'summary' => $summary,
                    'limit' => $limit,
                    'offset' => $offset
                ]);
            }
            break;
            
        case 'POST':
            // Manual history entry (for corrections or special cases)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['product_id']) || !isset($input['size_name']) || !isset($input['change_type'])) {
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            $stockId = $input['stock_id'] ?? null;
            $productId = $input['product_id'];
            $sizeName = strtoupper(trim($input['size_name']));
            $oldQuantity = intval($input['old_quantity'] ?? 0);
            $newQuantity = intval($input['new_quantity'] ?? 0);
            $changeType = strtoupper($input['change_type']);
            $changeReason = $input['change_reason'] ?? 'Manual entry';
            $changedBy = $input['changed_by'] ?? 'System';
            $notes = $input['notes'] ?? null;
            
            // Validate change type
            $validChangeTypes = ['ADD', 'REMOVE', 'ADJUST', 'RESERVE', 'RELEASE'];
            if (!in_array($changeType, $validChangeTypes)) {
                echo json_encode(['success' => false, 'message' => 'Invalid change type']);
                break;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO production_soustraitance_stock_history 
                (stock_id, product_id, size_name, old_quantity, new_quantity, change_type, change_reason, changed_by, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            if ($stmt->execute([$stockId, $productId, $sizeName, $oldQuantity, $newQuantity, $changeType, $changeReason, $changedBy, $notes])) {
                echo json_encode(['success' => true, 'message' => 'History entry created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create history entry']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>