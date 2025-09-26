<?php
// Alternative approach: Use batch_reference prefix and notes to identify soustraitance
// This version works with your existing table structure

require_once 'config.php';
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get batch with smart product detection
                $stmt = $db->prepare("
                    SELECT b.*, 
                           -- Try regular products first
                           COALESCE(p.nom_product, sp.nom_product) as nom_product,
                           COALESCE(p.reference_product, sp.reference_product) as reference_product,
                           CASE 
                               WHEN b.batch_reference LIKE 'BATCH-ST-%' THEN sc.name
                               WHEN sp.id IS NOT NULL THEN sc.name
                               ELSE p.boutique_origin 
                           END as boutique_origin,
                           CASE 
                               WHEN b.batch_reference LIKE 'BATCH-ST-%' THEN 'soustraitance'
                               WHEN sp.id IS NOT NULL THEN 'soustraitance'
                               ELSE 'regular'
                           END as product_type,
                           u.nom as started_by_name
                    FROM production_batches b
                    LEFT JOIN production_ready_products p ON b.product_id = p.id
                    LEFT JOIN production_soustraitance_products sp ON b.product_id = sp.id
                    LEFT JOIN production_soustraitance_clients sc ON sp.client_id = sc.id
                    LEFT JOIN production_utilisateurs u ON b.started_by = u.id
                    WHERE b.id = :id
                ");
                $stmt->bindValue(':id', $_GET['id'], PDO::PARAM_INT);
                $stmt->execute();
                $batch = $stmt->fetch();

                if ($batch) {
                    // Determine material table based on batch type
                    $materialsTable = ($batch['product_type'] === 'soustraitance') 
                        ? 'production_soustraitance_product_materials' 
                        : 'production_product_materials';
                    
                    // Rest of the material calculation logic...
                    echo json_encode(['success' => true, 'data' => $batch]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Batch non trouvé']);
                }
            } else {
                // List all batches with smart detection
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;

                $stmt = $db->prepare("
                    SELECT b.*, 
                           COALESCE(p.nom_product, sp.nom_product) as nom_product,
                           COALESCE(p.reference_product, sp.reference_product) as reference_product,
                           CASE 
                               WHEN b.batch_reference LIKE 'BATCH-ST-%' THEN sc.name
                               WHEN sp.id IS NOT NULL THEN sc.name
                               ELSE p.boutique_origin 
                           END as boutique_origin,
                           CASE 
                               WHEN b.batch_reference LIKE 'BATCH-ST-%' THEN 'soustraitance'
                               WHEN sp.id IS NOT NULL THEN 'soustraitance'
                               ELSE 'regular'
                           END as product_type,
                           u.nom as started_by_name
                    FROM production_batches b
                    LEFT JOIN production_ready_products p ON b.product_id = p.id
                    LEFT JOIN production_soustraitance_products sp ON b.product_id = sp.id
                    LEFT JOIN production_soustraitance_clients sc ON sp.client_id = sc.id
                    LEFT JOIN production_utilisateurs u ON b.started_by = u.id
                    ORDER BY b.created_at DESC
                    LIMIT :limit OFFSET :offset
                ");
                
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $batches = $stmt->fetchAll();

                echo json_encode(['success' => true, 'data' => $batches, 'page' => $page, 'limit' => $limit]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            // Soustraitance production with prefix-based identification
            if (isset($data['action']) && $data['action'] === 'start_soustraitance_production') {
                // Use BATCH-ST- prefix instead of product_type column
                $batchReference = 'BATCH-ST-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
                
                // Store client name in notes for identification
                $clientName = $data['client_name'] ?? 'Sous-traitance';
                $notes = "SOUSTRAITANCE: {$clientName} | " . ($data['notes'] ?? '');
                
                $stmt = $db->prepare("
                    INSERT INTO production_batches
                    (batch_reference, product_id, quantity_to_produce, sizes_breakdown, status, started_by, started_at, notes)
                    VALUES (:batch_reference, :product_id, :quantity_to_produce, :sizes_breakdown, 'planifie', :started_by, NOW(), :notes)
                ");
                
                // Execute with standard columns only
                $stmt->bindValue(':batch_reference', $batchReference);
                $stmt->bindValue(':product_id', $data['product_id'], PDO::PARAM_INT);
                $stmt->bindValue(':quantity_to_produce', $data['quantity_to_produce'], PDO::PARAM_INT);
                $stmt->bindValue(':sizes_breakdown', $data['sizes_breakdown']);
                $stmt->bindValue(':started_by', $data['user_id'], PDO::PARAM_INT);
                $stmt->bindValue(':notes', $notes);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Batch sous-traitance créé avec succès',
                        'batch_reference' => $batchReference,
                        'batch_id' => $db->lastInsertId()
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du batch']);
                }
            }
            break;
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
