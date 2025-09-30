<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Only GET method allowed');
    }
    
    $productId = $_GET['product_id'] ?? null;
    $action = $_GET['action'] ?? 'history';
    
    if (!$productId) {
        throw new Exception('Product ID is required');
    }
    
    switch ($action) {
        case 'history':
            // Get size configuration history
            $stmt = $db->prepare("
                SELECT 
                    h.*,
                    b.boutique_origin,
                    b.transfer_date,
                    b.total_quantity as batch_total_quantity,
                    b.notes as batch_notes,
                    p.nom as product_name
                FROM product_size_configuration_history h
                LEFT JOIN product_transfer_batches b ON h.transfer_batch_id = b.id
                LEFT JOIN production_ready_products p ON h.product_id = p.id
                WHERE h.product_id = ?
                ORDER BY h.configured_at DESC, h.transfer_batch_id DESC, h.size_value
            ");
            $stmt->execute([$productId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Group by transfer batch
            $groupedHistory = [];
            foreach ($history as $record) {
                $batchId = $record['transfer_batch_id'] ?? 'initial';
                if (!isset($groupedHistory[$batchId])) {
                    $groupedHistory[$batchId] = [
                        'batch_info' => [
                            'id' => $record['transfer_batch_id'],
                            'boutique_origin' => $record['boutique_origin'],
                            'transfer_date' => $record['transfer_date'],
                            'total_quantity' => $record['batch_total_quantity'],
                            'notes' => $record['batch_notes']
                        ],
                        'size_changes' => []
                    ];
                }
                $groupedHistory[$batchId]['size_changes'][] = $record;
            }
            
            echo json_encode([
                'success' => true,
                'product_id' => $productId,
                'history' => array_values($groupedHistory)
            ]);
            break;
            
        case 'batches':
            // Get transfer batches for product
            $stmt = $db->prepare("
                SELECT 
                    b.*,
                    p.nom as product_name,
                    p.external_product_id,
                    COUNT(h.id) as size_changes_count
                FROM product_transfer_batches b
                LEFT JOIN production_ready_products p ON b.product_id = p.id
                LEFT JOIN product_size_configuration_history h ON b.id = h.transfer_batch_id
                WHERE b.product_id = ?
                GROUP BY b.id
                ORDER BY b.transfer_date DESC
            ");
            $stmt->execute([$productId]);
            $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'product_id' => $productId,
                'transfer_batches' => $batches
            ]);
            break;
            
        case 'current_config':
            // Get current size configuration
            $stmt = $db->prepare("
                SELECT 
                    p.id,
                    p.nom,
                    p.external_product_id,
                    p.boutique_origin,
                    p.production_quantities,
                    p.sizes_data,
                    p.total_configured_quantity,
                    p.size_configuration_version,
                    p.last_transfer_batch_id,
                    p.transferred_at,
                    b.transfer_date as last_transfer_date,
                    b.notes as last_transfer_notes
                FROM production_ready_products p
                LEFT JOIN product_transfer_batches b ON p.last_transfer_batch_id = b.id
                WHERE p.id = ?
            ");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                throw new Exception('Product not found');
            }
            
            // Parse JSON fields
            $product['production_quantities'] = json_decode($product['production_quantities'] ?? '{}', true);
            $product['sizes_data'] = json_decode($product['sizes_data'] ?? '{}', true);
            
            echo json_encode([
                'success' => true,
                'product' => $product
            ]);
            break;
            
        case 'statistics':
            // Get size configuration statistics
            $stmt = $db->prepare("
                SELECT 
                    COUNT(DISTINCT h.transfer_batch_id) as total_transfers,
                    COUNT(h.id) as total_size_changes,
                    COUNT(CASE WHEN h.action_type = 'added' THEN 1 END) as sizes_added,
                    COUNT(CASE WHEN h.action_type = 'updated' THEN 1 END) as sizes_updated,
                    COUNT(CASE WHEN h.action_type = 'preserved' THEN 1 END) as sizes_preserved,
                    MIN(h.configured_at) as first_configuration,
                    MAX(h.configured_at) as last_configuration,
                    p.nom as product_name,
                    p.total_configured_quantity as current_total_quantity
                FROM product_size_configuration_history h
                LEFT JOIN production_ready_products p ON h.product_id = p.id
                WHERE h.product_id = ?
                GROUP BY h.product_id
            ");
            $stmt->execute([$productId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'product_id' => $productId,
                'statistics' => $stats
            ]);
            break;
            
        default:
            throw new Exception('Invalid action specified');
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>