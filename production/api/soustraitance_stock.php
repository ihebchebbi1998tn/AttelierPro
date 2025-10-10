<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

function logStockChange($pdo, $stockId, $productId, $sizeName, $oldQuantity, $newQuantity, $changeType, $changeReason, $changedBy, $notes = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO production_soustraitance_stock_history 
            (stock_id, product_id, size_name, old_quantity, new_quantity, change_type, change_reason, changed_by, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$stockId, $productId, $sizeName, $oldQuantity, $newQuantity, $changeType, $changeReason, $changedBy, $notes]);
    } catch (Exception $e) {
        error_log("Failed to log stock change: " . $e->getMessage());
    }
}

function getAvailableQuantity($stockQuantity, $reservedQuantity) {
    return max(0, $stockQuantity - $reservedQuantity);
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['product_id'])) {
                // Get stock for specific product
                $productId = $_GET['product_id'];
                $stmt = $pdo->prepare("
                    SELECT 
                        s.*,
                        p.nom_product,
                        p.reference_product,
                        s.stock_quantity as available_quantity,
                        CASE 
                            WHEN s.stock_quantity <= s.minimum_threshold THEN 'LOW'
                            WHEN s.stock_quantity = 0 THEN 'OUT_OF_STOCK'
                            ELSE 'AVAILABLE'
                        END as stock_status
                    FROM production_soustraitance_stock s
                    JOIN production_soustraitance_products p ON s.product_id = p.id
                    WHERE s.product_id = ?
                    ORDER BY 
                        CASE s.size_name
                            WHEN 'XS' THEN 1
                            WHEN 'S' THEN 2
                            WHEN 'M' THEN 3
                            WHEN 'L' THEN 4
                            WHEN 'XL' THEN 5
                            WHEN 'XXL' THEN 6
                            WHEN '3XL' THEN 7
                            WHEN '4XL' THEN 8
                            ELSE 999
                        END,
                        CAST(s.size_name AS UNSIGNED)
                ");
                $stmt->execute([$productId]);
                $stocks = $stmt->fetchAll();
                
                // Get stock summary
                $summaryStmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as total_sizes,
                        SUM(s.stock_quantity) as total_stock,
                        0 as total_reserved,
                        SUM(s.stock_quantity) as total_available,
                        COUNT(CASE WHEN s.stock_quantity <= s.minimum_threshold THEN 1 END) as sizes_low_stock,
                        COUNT(CASE WHEN s.stock_quantity = 0 THEN 1 END) as sizes_out_of_stock
                    FROM production_soustraitance_stock s
                    WHERE s.product_id = ?
                ");
                $summaryStmt->execute([$productId]);
                $summary = $summaryStmt->fetch();
                
                echo json_encode([
                    'success' => true,
                    'data' => $stocks,
                    'summary' => $summary
                ]);
            } elseif (isset($_GET['id'])) {
                // Get specific stock entry
                $id = $_GET['id'];
                $stmt = $pdo->prepare("
                    SELECT 
                        s.*,
                        p.nom_product,
                        p.reference_product,
                        s.stock_quantity as available_quantity
                    FROM production_soustraitance_stock s
                    JOIN production_soustraitance_products p ON s.product_id = p.id
                    WHERE s.id = ?
                ");
                $stmt->execute([$id]);
                $stock = $stmt->fetch();
                
                if ($stock) {
                    echo json_encode(['success' => true, 'data' => $stock]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Stock entry not found']);
                }
            } else {
                // Get all stock entries
                $stmt = $pdo->prepare("
                    SELECT 
                        s.*,
                        p.nom_product,
                        p.reference_product,
                        p.client_name,
                        s.stock_quantity as available_quantity,
                        CASE 
                            WHEN s.stock_quantity <= s.minimum_threshold THEN 'LOW'
                            WHEN s.stock_quantity = 0 THEN 'OUT_OF_STOCK'
                            ELSE 'AVAILABLE'
                        END as stock_status
                    FROM production_soustraitance_stock s
                    JOIN production_soustraitance_products p ON s.product_id = p.id
                    ORDER BY p.nom_product, s.size_name
                ");
                $stmt->execute();
                $stocks = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $stocks]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['product_id']) || !isset($input['size_name']) || !isset($input['stock_quantity'])) {
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                break;
            }
            
            $productId = $input['product_id'];
            $sizeName = strtoupper(trim($input['size_name']));
            $stockQuantity = max(0, intval($input['stock_quantity']));
            $reservedQuantity = null; // Always NULL
            $minimumThreshold = max(0, intval($input['minimum_threshold'] ?? 5));
            $maximumCapacity = max(0, intval($input['maximum_capacity'] ?? 1000));
            $updatedBy = $input['updated_by'] ?? 'System';
            $notes = $input['notes'] ?? null;
            
            // Check if entry already exists
            $checkStmt = $pdo->prepare("SELECT id, stock_quantity FROM production_soustraitance_stock WHERE product_id = ? AND size_name = ?");
            $checkStmt->execute([$productId, $sizeName]);
            $existing = $checkStmt->fetch();
            
            if ($existing) {
                echo json_encode(['success' => false, 'message' => 'Stock entry already exists for this product and size']);
                break;
            }
            
            // Insert new stock entry
            $stmt = $pdo->prepare("
                INSERT INTO production_soustraitance_stock 
                (product_id, size_name, stock_quantity, reserved_quantity, minimum_threshold, maximum_capacity, updated_by, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            if ($stmt->execute([$productId, $sizeName, $stockQuantity, $reservedQuantity, $minimumThreshold, $maximumCapacity, $updatedBy, $notes])) {
                $stockId = $pdo->lastInsertId();
                
                // Log the stock creation
                logStockChange($pdo, $stockId, $productId, $sizeName, 0, $stockQuantity, 'ADD', 'Initial stock creation', $updatedBy, $notes);
                
                echo json_encode(['success' => true, 'message' => 'Stock entry created successfully', 'id' => $stockId]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create stock entry']);
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'Stock ID is required']);
                break;
            }
            
            $id = $input['id'];
            $updatedBy = $input['updated_by'] ?? 'System';
            
            // Get current stock info
            $currentStmt = $pdo->prepare("SELECT * FROM production_soustraitance_stock WHERE id = ?");
            $currentStmt->execute([$id]);
            $current = $currentStmt->fetch();
            
            if (!$current) {
                echo json_encode(['success' => false, 'message' => 'Stock entry not found']);
                break;
            }
            
            // Prepare update fields
            $updateFields = [];
            $updateValues = [];
            
            if (isset($input['stock_quantity'])) {
                $newQuantity = max(0, intval($input['stock_quantity']));
                $updateFields[] = "stock_quantity = ?";
                $updateValues[] = $newQuantity;
                
                // Log stock change
                if ($newQuantity != $current['stock_quantity']) {
                    $changeType = $newQuantity > $current['stock_quantity'] ? 'ADD' : 'REMOVE';
                    $changeReason = $input['change_reason'] ?? 'Stock adjustment';
                    logStockChange($pdo, $id, $current['product_id'], $current['size_name'], 
                                 $current['stock_quantity'], $newQuantity, $changeType, $changeReason, $updatedBy, $input['notes'] ?? null);
                }
            }
            
            if (isset($input['reserved_quantity'])) {
                $updateFields[] = "reserved_quantity = ?";
                $updateValues[] = null; // Always NULL
            }
            
            if (isset($input['minimum_threshold'])) {
                $updateFields[] = "minimum_threshold = ?";
                $updateValues[] = max(0, intval($input['minimum_threshold']));
            }
            
            if (isset($input['maximum_capacity'])) {
                $updateFields[] = "maximum_capacity = ?";
                $updateValues[] = max(0, intval($input['maximum_capacity']));
            }
            
            if (isset($input['notes'])) {
                $updateFields[] = "notes = ?";
                $updateValues[] = $input['notes'];
            }
            
            $updateFields[] = "updated_by = ?";
            $updateValues[] = $updatedBy;
            
            $updateValues[] = $id;
            
            if (empty($updateFields)) {
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
                break;
            }
            
            $sql = "UPDATE production_soustraitance_stock SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            
            if ($stmt->execute($updateValues)) {
                echo json_encode(['success' => true, 'message' => 'Stock updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update stock']);
            }
            break;
            
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                echo json_encode(['success' => false, 'message' => 'Stock ID is required']);
                break;
            }
            
            $id = $input['id'];
            $deletedBy = $input['deleted_by'] ?? 'System';
            
            // Get stock info before deletion
            $stockStmt = $pdo->prepare("SELECT * FROM production_soustraitance_stock WHERE id = ?");
            $stockStmt->execute([$id]);
            $stock = $stockStmt->fetch();
            
            if (!$stock) {
                echo json_encode(['success' => false, 'message' => 'Stock entry not found']);
                break;
            }
            
            // Log deletion
            logStockChange($pdo, $id, $stock['product_id'], $stock['size_name'], 
                         $stock['stock_quantity'], 0, 'REMOVE', 'Stock entry deleted', $deletedBy);
            
            // Delete stock entry
            $stmt = $pdo->prepare("DELETE FROM production_soustraitance_stock WHERE id = ?");
            
            if ($stmt->execute([$id])) {
                echo json_encode(['success' => true, 'message' => 'Stock entry deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete stock entry']);
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