<?php
require_once 'config.php';
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Récupérer un batch spécifique avec détails
                $stmt = $db->prepare("
                    SELECT b.*, 
                           CASE 
                               WHEN b.product_type = 'soustraitance' THEN sp.nom_product
                               ELSE p.nom_product 
                           END as nom_product,
                           CASE 
                               WHEN b.product_type = 'soustraitance' THEN sp.reference_product
                               ELSE p.reference_product 
                           END as reference_product,
                           COALESCE(b.boutique_origin, 
                               CASE 
                                   WHEN b.product_type = 'soustraitance' THEN sc.name
                                   ELSE p.boutique_origin 
                               END
                           ) as boutique_origin,
                           CASE 
                               WHEN b.product_type = 'soustraitance' THEN sp.client_id
                               ELSE NULL 
                           END as client_id,
                           u.nom as started_by_name
                    FROM production_batches b
                    LEFT JOIN production_ready_products p ON b.product_id = p.id AND (b.product_type IS NULL OR b.product_type = 'regular')
                    LEFT JOIN production_soustraitance_products sp ON b.product_id = sp.id AND b.product_type = 'soustraitance'
                    LEFT JOIN production_soustraitance_clients sc ON sp.client_id = sc.id
                    LEFT JOIN production_utilisateurs u ON b.started_by = u.id
                    WHERE b.id = :id
                ");
                $stmt->bindValue(':id', $_GET['id'], PDO::PARAM_INT);
                $stmt->execute();
                $batch = $stmt->fetch();
                
                // Mark batch as seen when viewing details
                if ($batch) {
                    try {
                        $checkStmt = $db->prepare("SHOW COLUMNS FROM production_batches LIKE 'is_seen'");
                        $checkStmt->execute();
                        if ($checkStmt->fetch()) {
                            $markSeenStmt = $db->prepare("UPDATE production_batches SET is_seen = 1 WHERE id = :id");
                            $markSeenStmt->bindValue(':id', $_GET['id'], PDO::PARAM_INT);
                            $markSeenStmt->execute();
                        }
                    } catch (Exception $e) {
                        // Silently fail if column doesn't exist yet
                        error_log("Could not mark batch as seen: " . $e->getMessage());
                    }
                }

                if ($batch) {
                    // Recompute materials used based on product configuration and batch sizes
                    $sizesData = [];
                    $totalPlannedPieces = (int)($batch['quantity_to_produce'] ?? 0);
                    if (!empty($batch['sizes_breakdown'])) {
                        $decoded = json_decode($batch['sizes_breakdown'], true);
                        if (is_array($decoded)) {
                            $sizesData = $decoded;
                            $totalPlannedPieces = array_sum(array_map('intval', $sizesData));
                        }
                    }
                    
                    // Decode materials_quantities if exists
                    $materialsQuantitiesData = [];
                    if (!empty($batch['materials_quantities'])) {
                        $decoded = json_decode($batch['materials_quantities'], true);
                        if (is_array($decoded)) {
                            $materialsQuantitiesData = $decoded;
                        }
                    }

                    // Get materials configuration based on product type
                    if ($batch['product_type'] === 'soustraitance') {
                        // For soustraitance products, use soustraitance_product_materials table
                        $cfgStmt = $db->prepare("
                            SELECT 
                                spm.material_id,
                                spm.quantity_needed,
                                spm.quantity_type_id,
                                spm.size_specific,
                                m.nom as nom_matiere,
                                m.couleur,
                                m.prix_unitaire as unit_cost,
                                qt.nom as quantity_type_name,
                                qt.unite as quantity_unit,
                                spm.notes as commentaire
                            FROM production_soustraitance_product_materials spm
                            JOIN production_matieres m ON spm.material_id = m.id
                            JOIN production_quantity_types qt ON spm.quantity_type_id = qt.id
                            WHERE spm.product_id = :pid
                        ");
                    } else {
                        // For regular products, use product_materials table
                        $cfgStmt = $db->prepare("
                            SELECT 
                                ppm.material_id,
                                ppm.quantity_needed,
                                ppm.quantity_type_id,
                                ppm.size_specific,
                                m.nom as nom_matiere,
                                m.couleur,
                                m.prix_unitaire as unit_cost,
                                qt.nom as quantity_type_name,
                                qt.unite as quantity_unit,
                                ppm.commentaire
                            FROM production_product_materials ppm
                            JOIN production_matieres m ON ppm.material_id = m.id
                            JOIN production_quantity_types qt ON ppm.quantity_type_id = qt.id
                            WHERE ppm.product_id = :pid
                        ");
                    }
                    $cfgStmt->bindValue(':pid', $batch['product_id'], PDO::PARAM_INT);
                    $cfgStmt->execute();
                    $cfgRows = $cfgStmt->fetchAll();

                    $agg = [];
                    foreach ($cfgRows as $row) {
                        $mid = $row['material_id'];
                        if (!isset($agg[$mid])) {
                            $agg[$mid] = [
                                'id' => null,
                                'material_id' => $mid,
                                'nom_matiere' => $row['nom_matiere'],
                                'couleur' => $row['couleur'],
                                'quantity_type_name' => $row['quantity_type_name'],
                                'quantity_unit' => $row['quantity_unit'],
                                'commentaire' => $row['commentaire'] ?? '',
                                'quantity_used' => 0,
                                'unit_cost' => $row['unit_cost'],
                                'total_cost' => 0,
                                'quantity_filled' => isset($materialsQuantitiesData[$mid]) ? (float)$materialsQuantitiesData[$mid] : null,
                            ];
                        }
                        $sizeSpecific = $row['size_specific'];
                        if ($sizeSpecific && $sizeSpecific !== 'none') {
                            // Handle case sensitivity - sizes in database might be uppercase while planned quantities are lowercase
                            $sizeKey = strtolower($sizeSpecific);
                            $pieces = isset($sizesData[$sizeKey]) ? (int)$sizesData[$sizeKey] : 0;
                            // Also try the original case if lowercase didn't work
                            if ($pieces === 0 && isset($sizesData[$sizeSpecific])) {
                                $pieces = (int)$sizesData[$sizeSpecific];
                            }
                        } else {
                            $pieces = $totalPlannedPieces;
                        }
                        $needed = (float)$row['quantity_needed'] * $pieces;
                        $agg[$mid]['quantity_used'] += $needed;
                    }

                    // Compute total costs
                    foreach ($agg as &$v) {
                        $v['total_cost'] = (float)$v['quantity_used'] * (float)$v['unit_cost'];
                    }
                    unset($v);

                    $batch['materials_used'] = array_values($agg);

                    // Récupérer les images du batch depuis la nouvelle table
                    try {
                        $imagesStmt = $db->prepare("
                            SELECT id as image_id, batch_id, image_path as file_path, original_filename, file_size, description, uploaded_by, created_at
                            FROM productions_batches_images 
                            WHERE batch_id = :batch_id
                            ORDER BY created_at ASC
                        ");
                        $imagesStmt->bindValue(':batch_id', $_GET['id'], PDO::PARAM_INT);
                        $imagesStmt->execute();
                        $images = $imagesStmt->fetchAll();
                        
                        // Add full URLs for images
                        foreach($images as &$image) {
                            $image['full_url'] = 'https://luccibyey.com.tn/production/api/' . $image['file_path'];
                        }
                        $batch['batch_images'] = $images;
                    } catch (Exception $e) {
                        // If images table doesn't exist, set empty array  
                        $batch['batch_images'] = [];
                    }

                    // Récupérer les pièces jointes du batch
                    try {
                        $attachmentsStmt = $db->prepare("
                            SELECT id, batch_id, filename, original_filename, file_path, file_type, file_size, mime_type, description, uploaded_by, created_date, modified_date
                            FROM production_batch_attachments 
                            WHERE batch_id = :batch_id
                            ORDER BY created_date DESC
                        ");
                        $attachmentsStmt->bindValue(':batch_id', $_GET['id'], PDO::PARAM_INT);
                        $attachmentsStmt->execute();
                        $attachments = $attachmentsStmt->fetchAll();
                        
                        // Add full URLs for attachments
                        foreach($attachments as &$attachment) {
                            $attachment['full_url'] = 'https://luccibyey.com.tn/production/api/' . $attachment['file_path'];
                        }
                        $batch['batch_attachments'] = $attachments;
                    } catch (Exception $e) {
                        // If attachments table doesn't exist, set empty array
                        $batch['batch_attachments'] = [];
                    }

                    // Récupérer les déchets/restes (leftovers) du batch
                    try {
                        $leftoversStmt = $db->prepare("
                            SELECT 
                                l.*,
                                m.nom as nom_matiere,
                                m.reference as code_matiere,
                                m.quantite_stock as current_stock,
                                qt.nom as quantity_type_name,
                                qt.unite as quantity_unit
                            FROM production_batch_leftovers l
                            JOIN production_matieres m ON l.material_id = m.id
                            LEFT JOIN production_quantity_types qt ON m.quantity_type_id = qt.id
                            WHERE l.batch_id = :batch_id
                            ORDER BY l.created_at DESC
                        ");
                        $leftoversStmt->bindValue(':batch_id', $_GET['id'], PDO::PARAM_INT);
                        $leftoversStmt->execute();
                        $leftovers = $leftoversStmt->fetchAll();
                        $batch['batch_leftovers'] = $leftovers;
                    } catch (Exception $e) {
                        // If leftovers table doesn't exist, set empty array
                        $batch['batch_leftovers'] = [];
                    }

                    echo json_encode(['success' => true, 'data' => $batch]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Batch non trouvé']);
                }
            } else {
                // Pagination + search
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
                $offset = ($page - 1) * $limit;
                $status = $_GET['status'] ?? '';
                $search = $_GET['search'] ?? '';
                $unseenOnly = isset($_GET['unseen_only']) && $_GET['unseen_only'] == '1';

                $where = "WHERE 1=1";
                $params = [];

                if ($status) {
                    $where .= " AND b.status = :status";
                    $params[':status'] = $status;
                }
                if ($search) {
                    $where .= " AND (b.batch_reference LIKE :search OR p.nom_product LIKE :search)";
                    $params[':search'] = "%$search%";
                }
                
                // Filter for unseen batches if requested
                if ($unseenOnly) {
                    // Check if is_seen column exists
                    try {
                        $checkStmt = $db->prepare("SHOW COLUMNS FROM production_batches LIKE 'is_seen'");
                        $checkStmt->execute();
                        if ($checkStmt->fetch()) {
                            $where .= " AND b.is_seen = 0 AND b.created_at IS NOT NULL";
                        }
                    } catch (Exception $e) {
                        // Column doesn't exist yet, ignore filter
                    }
                }

                // Count total
                $countStmt = $db->prepare("
                    SELECT COUNT(*) as total
                    FROM production_batches b
                    JOIN production_ready_products p ON b.product_id = p.id
                    $where
                ");
                foreach ($params as $k => $v) {
                    $countStmt->bindValue($k, $v);
                }
                $countStmt->execute();
                $total = $countStmt->fetch()['total'];

                // Get data
                $stmt = $db->prepare("
                    SELECT b.*, 
                           CASE 
                               WHEN b.product_type = 'soustraitance' THEN sp.nom_product
                               ELSE p.nom_product 
                           END as nom_product,
                           CASE 
                               WHEN b.product_type = 'soustraitance' THEN sp.reference_product
                               ELSE p.reference_product 
                           END as reference_product,
                           COALESCE(b.boutique_origin, 
                               CASE 
                                   WHEN b.product_type = 'soustraitance' THEN sc.name
                                   ELSE p.boutique_origin 
                               END
                           ) as boutique_origin,
                           CASE 
                               WHEN b.product_type = 'soustraitance' THEN sp.client_id
                               ELSE NULL 
                           END as client_id,
                           u.nom as started_by_name
                    FROM production_batches b
                    LEFT JOIN production_ready_products p ON b.product_id = p.id AND (b.product_type IS NULL OR b.product_type = 'regular')
                    LEFT JOIN production_soustraitance_products sp ON b.product_id = sp.id AND b.product_type = 'soustraitance'
                    LEFT JOIN production_soustraitance_clients sc ON sp.client_id = sc.id
                    LEFT JOIN production_utilisateurs u ON b.started_by = u.id
                    $where
                    ORDER BY b.created_at DESC
                    LIMIT :limit OFFSET :offset
                ");
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $batches = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'data' => $batches,
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            // === Start Soustraitance Production ===
            if (isset($data['action']) && $data['action'] === 'start_soustraitance_production') {
                if (empty($data['product_id']) || empty($data['quantity_to_produce'])) {
                    echo json_encode(['success' => false, 'message' => 'product_id et quantity_to_produce requis']);
                    break;
                }

                $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
                if ($userId) {
                    $checkUser = $db->prepare("SELECT id FROM production_utilisateurs WHERE id = :id LIMIT 1");
                    $checkUser->bindValue(':id', $userId, PDO::PARAM_INT);
                    $checkUser->execute();
                    if (!$checkUser->fetch()) {
                        $userId = null; // avoid FK errors
                    }
                }

                $db->beginTransaction();
                try {
                    // Vérifier matériaux configurés pour produit sous-traitance et récupérer production_specifications
                    $productStmt = $db->prepare("SELECT materials_configured, client_id, production_specifications FROM production_soustraitance_products WHERE id = :pid");
                    $productStmt->bindValue(':pid', $data['product_id'], PDO::PARAM_INT);
                    $productStmt->execute();
                    $product = $productStmt->fetch();
                    if (!$product || !$product['materials_configured']) {
                        echo json_encode(['success' => false, 'message' => 'Matériaux non configurés pour ce produit sous-traitance']);
                        $db->rollBack();
                        break;
                    }

                    // Get client name for boutique_origin
                    $clientStmt = $db->prepare("SELECT name FROM production_soustraitance_clients WHERE id = :client_id");
                    $clientStmt->bindValue(':client_id', $product['client_id'], PDO::PARAM_INT);
                    $clientStmt->execute();
                    $client = $clientStmt->fetch();
                    $boutique_origin = $client ? $client['name'] : 'Sous-traitance';

                    $batchReference = 'BATCH-ST-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

                    // Champs optionnels -> variables
                    $sizes_breakdown = $data['sizes_breakdown'] ?? null;
                    $notification_emails = $data['notification_emails'] ?? null;
                    $notes = $data['notes'] ?? null;
                    $production_specifications = $product['production_specifications'] ?? null;

                    // Parse sizes breakdown for accurate material needs per size
                    $sizesData = [];
                    $totalPlannedPieces = (int)($data['quantity_to_produce'] ?? 0);
                    if (!empty($sizes_breakdown)) {
                        $decoded = json_decode($sizes_breakdown, true);
                        if (is_array($decoded)) {
                            $sizesData = $decoded;
                            $totalPlannedPieces = array_sum(array_map('intval', $sizesData));
                        }
                    }

                    // Insert into production_batches with soustraitance reference
                    $batchStmt = $db->prepare("
                        INSERT INTO production_batches
                        (batch_reference, product_id, quantity_to_produce, sizes_breakdown, production_specifications, status, notification_emails, started_by, started_at, notes, product_type, boutique_origin)
                        VALUES (:batch_reference, :product_id, :quantity_to_produce, :sizes_breakdown, :production_specifications, 'planifie', :notification_emails, :started_by, NOW(), :notes, 'soustraitance', :boutique_origin)
                    ");
                    $batchStmt->bindValue(':batch_reference', $batchReference);
                    $batchStmt->bindValue(':product_id', $data['product_id'], PDO::PARAM_INT);
                    $batchStmt->bindValue(':quantity_to_produce', $data['quantity_to_produce'], PDO::PARAM_INT);
                    $batchStmt->bindValue(':sizes_breakdown', $sizes_breakdown);
                    $batchStmt->bindValue(':production_specifications', $production_specifications);
                    $batchStmt->bindValue(':notification_emails', $notification_emails);
                    $batchStmt->bindValue(':started_by', $userId, $userId ? PDO::PARAM_INT : PDO::PARAM_NULL);
                    $batchStmt->bindValue(':notes', $notes);
                    $batchStmt->bindValue(':boutique_origin', $boutique_origin);
                    $batchStmt->execute();
                    $batchId = $db->lastInsertId();

                    // Add initial status history record
                    try {
                        $historyStmt = $db->prepare("
                            INSERT INTO batch_status_history 
                            (batch_id, old_status, new_status, changed_by, comments) 
                            VALUES (?, NULL, 'planifie', ?, 'Batch sous-traitance created')
                        ");
                        $historyStmt->execute([$batchId, $userId ? "User $userId" : 'System']);
                    } catch (Exception $e) {
                        error_log("Failed to create initial status history: " . $e->getMessage());
                    }

                    // Récupérer les matériaux de sous-traitance
                    $materialsStmt = $db->prepare("
                        SELECT 
                            spm.*, 
                            m.quantite_stock as stock, 
                            m.prix_unitaire as prix,
                            m.quantity_type_id as material_quantity_type_id
                        FROM production_soustraitance_product_materials spm
                        JOIN production_matieres m ON spm.material_id = m.id
                        WHERE spm.product_id = :pid
                    ");
                    $materialsStmt->bindValue(':pid', $data['product_id'], PDO::PARAM_INT);
                    $materialsStmt->execute();
                    $materials = $materialsStmt->fetchAll();

                    $totalCost = 0;
                    $processedKeys = [];
                    $transactionIds = [];
                    
                    foreach ($materials as $mat) {
                        $sizeSpecific = $mat['size_specific'] ?? null;
                        $key = $mat['material_id'] . '|' . ($sizeSpecific ? $sizeSpecific : 'none');
                        if (isset($processedKeys[$key])) {
                            // Skip duplicate material-size configs
                            continue;
                        }
                        $processedKeys[$key] = true;

                        // Determine planned pieces for this config
                        if ($sizeSpecific && $sizeSpecific !== 'none') {
                            // Handle case sensitivity - sizes in database might be uppercase while planned quantities are lowercase
                            $sizeKey = strtolower($sizeSpecific);
                            $plannedPieces = isset($sizesData[$sizeKey]) ? (int)$sizesData[$sizeKey] : 0;
                            // Also try the original case if lowercase didn't work
                            if ($plannedPieces === 0 && isset($sizesData[$sizeSpecific])) {
                                $plannedPieces = (int)$sizesData[$sizeSpecific];
                            }
                        } else {
                            $plannedPieces = $totalPlannedPieces;
                        }

                        $needed = (float)$mat['quantity_needed'] * $plannedPieces;
                        if ($needed <= 0) continue; // Skip if no material needed
                        
                        if ($needed > $mat['stock']) {
                            // Get material details for better error message
                            $matDetailStmt = $db->prepare("SELECT nom, couleur FROM production_matieres WHERE id = :id");
                            $matDetailStmt->bindValue(':id', $mat['material_id'], PDO::PARAM_INT);
                            $matDetailStmt->execute();
                            $matDetail = $matDetailStmt->fetch();
                            
                            $matName = $matDetail ? $matDetail['nom'] : "Matériau ID {$mat['material_id']}";
                            $matColor = $matDetail && $matDetail['couleur'] ? " ({$matDetail['couleur']})" : '';
                            
                            // Get quantity unit for better error message
                            $unitStmt = $db->prepare("SELECT unite FROM production_quantity_types WHERE id = :id");
                            $unitStmt->bindValue(':id', $mat['material_quantity_type_id'], PDO::PARAM_INT);
                            $unitStmt->execute();
                            $unitData = $unitStmt->fetch();
                            $unit = $unitData ? $unitData['unite'] : '';
                            
                            echo json_encode(['success' => false, 'message' => "Stock insuffisant pour {$matName}{$matColor}. Disponible: {$mat['stock']} {$unit}, Requis: {$needed} {$unit}"]);
                            $db->rollBack();
                            return;
                        }

                        $unitCost = $mat['prix'] ?? 0;
                        $lineCost = $needed * $unitCost;
                        $totalCost += $lineCost;

                        // DEDUCT STOCK - Only after successful batch creation within same transaction
                        // Create stock transaction record
                        $transactionStmt = $db->prepare("
                            INSERT INTO production_transactions_stock 
                            (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, reference_commande, user_id) 
                            VALUES (:material_id, 'out', :quantite, :quantity_type_id, :prix_unitaire, :cout_total, :motif, :reference, :user_id)
                        ");
                        $transactionStmt->bindValue(':material_id', $mat['material_id'], PDO::PARAM_INT);
                        $transactionStmt->bindValue(':quantite', $needed);
                        $transactionStmt->bindValue(':quantity_type_id', $mat['material_quantity_type_id'], PDO::PARAM_INT);
                        $transactionStmt->bindValue(':prix_unitaire', $unitCost);
                        $transactionStmt->bindValue(':cout_total', $lineCost);
                        $transactionStmt->bindValue(':motif', 'Production sous-traitance');
                        $transactionStmt->bindValue(':reference', $batchReference);
                        $transactionStmt->bindValue(':user_id', $userId, $userId ? PDO::PARAM_INT : PDO::PARAM_NULL);
                        $transactionStmt->execute();
                        $transactionId = $db->lastInsertId();
                        $transactionIds[] = $transactionId;

                        // Deduct from material stock
                        $updateStockStmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock - :needed WHERE id = :material_id");
                        $updateStockStmt->bindValue(':needed', $needed);
                        $updateStockStmt->bindValue(':material_id', $mat['material_id'], PDO::PARAM_INT);
                        $updateStockStmt->execute();

                        // Record batch material usage
                        $batchMaterialStmt = $db->prepare("
                            INSERT INTO production_batch_materials 
                            (batch_id, material_id, quantity_used, quantity_type_id, unit_cost, total_cost, transaction_id) 
                            VALUES (:batch_id, :material_id, :quantity_used, :quantity_type_id, :unit_cost, :total_cost, :transaction_id)
                        ");
                        $batchMaterialStmt->bindValue(':batch_id', $batchId, PDO::PARAM_INT);
                        $batchMaterialStmt->bindValue(':material_id', $mat['material_id'], PDO::PARAM_INT);
                        $batchMaterialStmt->bindValue(':quantity_used', $needed);
                        $batchMaterialStmt->bindValue(':quantity_type_id', $mat['material_quantity_type_id'], PDO::PARAM_INT);
                        $batchMaterialStmt->bindValue(':unit_cost', $unitCost);
                        $batchMaterialStmt->bindValue(':total_cost', $lineCost);
                        $batchMaterialStmt->bindValue(':transaction_id', $transactionId, PDO::PARAM_INT);
                        $batchMaterialStmt->execute();
                    }

                    // Update total cost in batch
                    $updateCostStmt = $db->prepare("UPDATE production_batches SET total_materials_cost = :cost WHERE id = :id");
                    $updateCostStmt->bindValue(':cost', $totalCost);
                    $updateCostStmt->bindValue(':id', $batchId, PDO::PARAM_INT);
                    $updateCostStmt->execute();

                    // Mark soustraitance product as in production
                    $markSoustStmt = $db->prepare("
                        UPDATE production_soustraitance_products 
                        SET is_in_production = 1 
                        WHERE id = :product_id
                    ");
                    $markSoustStmt->bindValue(':product_id', $data['product_id'], PDO::PARAM_INT);
                    $markSoustStmt->execute();

                    $db->commit();

                    echo json_encode([
                        'success' => true,
                        'message' => 'Batch sous-traitance créé avec succès',
                        'batch_id' => $batchId,
                        'batch_reference' => $batchReference,
                        'total_cost' => $totalCost
                    ]);

                } catch (Exception $e) {
                    $db->rollback();
                    error_log("Soustraitance production error: " . $e->getMessage());
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du batch: ' . $e->getMessage()]);
                }
                break;
            }

            // === Start Production ===
            if (isset($data['action']) && $data['action'] === 'start_production') {
                if (empty($data['product_id']) || empty($data['quantity_to_produce'])) {
                    echo json_encode(['success' => false, 'message' => 'product_id et quantity_to_produce requis']);
                    break;
                }

                $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
                if ($userId) {
                    $checkUser = $db->prepare("SELECT id FROM production_utilisateurs WHERE id = :id LIMIT 1");
                    $checkUser->bindValue(':id', $userId, PDO::PARAM_INT);
                    $checkUser->execute();
                    if (!$checkUser->fetch()) {
                        $userId = null; // avoid FK errors
                    }
                }

                $db->beginTransaction();
                try {
                    // Vérifier matériaux configurés et récupérer production_specifications
                    $productStmt = $db->prepare("SELECT materials_configured, production_specifications FROM production_ready_products WHERE id = :pid");
                    $productStmt->bindValue(':pid', $data['product_id'], PDO::PARAM_INT);
                    $productStmt->execute();
                    $product = $productStmt->fetch();
                    if (!$product || !$product['materials_configured']) {
                        echo json_encode(['success' => false, 'message' => 'Matériaux non configurés pour ce produit']);
                        $db->rollBack();
                        break;
                    }

                    $batchReference = 'BATCH-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

                    // Champs optionnels -> variables
                    $sizes_breakdown = $data['sizes_breakdown'] ?? null;
                    $notification_emails = $data['notification_emails'] ?? null;
                    $notes = $data['notes'] ?? null;
                    $production_specifications = $product['production_specifications'] ?? null;

                    // Parse sizes breakdown for accurate material needs per size
                    $sizesData = [];
                    $totalPlannedPieces = (int)($data['quantity_to_produce'] ?? 0);
                    if (!empty($sizes_breakdown)) {
                        $decoded = json_decode($sizes_breakdown, true);
                        if (is_array($decoded)) {
                            $sizesData = $decoded;
                            $totalPlannedPieces = array_sum(array_map('intval', $sizesData));
                        }
                    }

                    $batchStmt = $db->prepare("
                        INSERT INTO production_batches
                        (batch_reference, product_id, quantity_to_produce, sizes_breakdown, production_specifications, status, notification_emails, started_by, started_at, notes)
                        VALUES (:batch_reference, :product_id, :quantity_to_produce, :sizes_breakdown, :production_specifications, 'planifie', :notification_emails, :started_by, NOW(), :notes)
                    ");
                    $batchStmt->bindValue(':batch_reference', $batchReference);
                    $batchStmt->bindValue(':product_id', $data['product_id'], PDO::PARAM_INT);
                    $batchStmt->bindValue(':quantity_to_produce', $data['quantity_to_produce'], PDO::PARAM_INT);
                    $batchStmt->bindValue(':sizes_breakdown', $sizes_breakdown);
                    $batchStmt->bindValue(':production_specifications', $production_specifications);
                    $batchStmt->bindValue(':notification_emails', $notification_emails);
                    $batchStmt->bindValue(':started_by', $userId, $userId ? PDO::PARAM_INT : PDO::PARAM_NULL);
                    $batchStmt->bindValue(':notes', $notes);
                    $batchStmt->execute();
                    $batchId = $db->lastInsertId();

                    // Add initial status history record
                    try {
                        $historyStmt = $db->prepare("
                            INSERT INTO batch_status_history 
                            (batch_id, old_status, new_status, changed_by, comments) 
                            VALUES (?, NULL, 'planifie', ?, 'Batch created')
                        ");
                        $historyStmt->execute([$batchId, $userId ? "User $userId" : 'System']);
                    } catch (Exception $e) {
                        error_log("Failed to create initial status history: " . $e->getMessage());
                    }

                    // Récupérer les matériaux
                    $materialsStmt = $db->prepare("
                        SELECT 
                            pm.*, 
                            m.quantite_stock as stock, 
                            m.prix_unitaire as prix,
                            m.quantity_type_id as material_quantity_type_id
                        FROM production_product_materials pm
                        JOIN production_matieres m ON pm.material_id = m.id
                        WHERE pm.product_id = :pid
                    ");
                    $materialsStmt->bindValue(':pid', $data['product_id'], PDO::PARAM_INT);
                    $materialsStmt->execute();
                    $materials = $materialsStmt->fetchAll();

                    $totalCost = 0;
                    $processedKeys = [];
                    foreach ($materials as $mat) {
                        $sizeSpecific = $mat['size_specific'] ?? null;
                        $key = $mat['material_id'] . '|' . ($sizeSpecific ? $sizeSpecific : 'none');
                        if (isset($processedKeys[$key])) {
                            // Skip duplicate material-size configs
                            continue;
                        }
                        $processedKeys[$key] = true;

                        // Determine planned pieces for this config
                        if ($sizeSpecific && $sizeSpecific !== 'none') {
                            $plannedPieces = isset($sizesData[$sizeSpecific]) ? (int)$sizesData[$sizeSpecific] : 0;
                        } else {
                            $plannedPieces = $totalPlannedPieces;
                        }

                        $needed = (float)$mat['quantity_needed'] * $plannedPieces;
                        if ($needed > $mat['stock']) {
                            echo json_encode(['success' => false, 'message' => "Stock insuffisant pour matériau ID {$mat['material_id']}"]);
                            $db->rollBack();
                            return;
                        }

                        $unitCost = $mat['prix'] ?? 0;
                        $lineCost = $needed * $unitCost;
                        $totalCost += $lineCost;

                        // Transaction OUT
                        $note = "Production $batchReference - quantité $needed";
                        // Determine quantity type id (prefer product-specific, fallback to material)
                        $qtId = isset($mat['quantity_type_id']) && $mat['quantity_type_id'] ? (int)$mat['quantity_type_id'] : (isset($mat['material_quantity_type_id']) ? (int)$mat['material_quantity_type_id'] : null);
                        if ($qtId === null) {
                            echo json_encode(['success' => false, 'message' => "Quantity type missing for material ID {$mat['material_id']}"]);
                            $db->rollBack();
                            return;
                        }

                        $tx = $db->prepare("
                            INSERT INTO production_transactions_stock
                            (material_id, type_mouvement, quantite, quantity_type_id, prix_unitaire, cout_total, motif, user_id, date_transaction)
                            VALUES (:mid, 'out', :q, :qt, :pu, :ct, :motif, :uid, NOW())
                        ");
                        $tx->bindValue(':mid', $mat['material_id'], PDO::PARAM_INT);
                        $tx->bindValue(':q', $needed);
                        $tx->bindValue(':qt', $qtId, PDO::PARAM_INT);
                        $tx->bindValue(':pu', $unitCost);
                        $tx->bindValue(':ct', $lineCost);
                        $tx->bindValue(':motif', $note);
                        $tx->bindValue(':uid', $userId, $userId ? PDO::PARAM_INT : PDO::PARAM_NULL);
                        $tx->execute();
                        $transactionId = $db->lastInsertId();

                        // Stock is already deducted by production_stock_deduction.php
                        // No need to deduct again here to avoid double deduction
                        // COMMENTED OUT: 
                        // $up = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock - :q WHERE id = :mid");
                        // $up->bindValue(':q', $needed);
                        // $up->bindValue(':mid', $mat['material_id'], PDO::PARAM_INT);
                        // $up->execute();

                        // Save in batch_materials
                        $bm = $db->prepare("
                            INSERT INTO production_batch_materials
                            (batch_id, material_id, quantity_used, quantity_type_id, unit_cost, total_cost, transaction_id)
                            VALUES (:bid, :mid, :q, :qt, :pu, :ct, :txid)
                        ");
                        $bm->bindValue(':bid', $batchId, PDO::PARAM_INT);
                        $bm->bindValue(':mid', $mat['material_id'], PDO::PARAM_INT);
                        $bm->bindValue(':q', $needed);
                        $bm->bindValue(':qt', $mat['quantity_type_id'], PDO::PARAM_INT);
                        $bm->bindValue(':pu', $unitCost);
                        $bm->bindValue(':ct', $lineCost);
                        $bm->bindValue(':txid', $transactionId, PDO::PARAM_INT);
                        $bm->execute();
                    }

                    // Update batch cost
                    $upd = $db->prepare("UPDATE production_batches SET total_materials_cost = :tc WHERE id = :bid");
                    $upd->bindValue(':tc', $totalCost);
                    $upd->bindValue(':bid', $batchId, PDO::PARAM_INT);
                    $upd->execute();

                    // Mark product as in production - remove from production_ready_products list
                    $markProductStmt = $db->prepare("
                        UPDATE production_ready_products 
                        SET is_in_production = 1 
                        WHERE id = :product_id
                    ");
                    $markProductStmt->bindValue(':product_id', $data['product_id'], PDO::PARAM_INT);
                    $markProductStmt->execute();

                    $db->commit();
                    echo json_encode([
                        'success' => true,
                        'message' => 'Production démarrée avec succès',
                        'batch_id' => $batchId,
                        'batch_reference' => $batchReference,
                        'total_cost' => $totalCost
                    ]);
                } catch (Exception $e) {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Erreur production: ' . $e->getMessage()]);
                }
            } else {
                // === Simple batch insert ===
                if (empty($data['product_id']) || empty($data['quantity_to_produce'])) {
                    echo json_encode(['success' => false, 'message' => 'product_id et quantity_to_produce requis']);
                    break;
                }

                $batchReference = $data['batch_reference'] ?? 'BATCH-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
                $sizes_breakdown = $data['sizes_breakdown'] ?? null;
                $notification_emails = $data['notification_emails'] ?? null;
                $notes = $data['notes'] ?? null;

                $stmt = $db->prepare("
                    INSERT INTO production_batches
                    (batch_reference, product_id, quantity_to_produce, sizes_breakdown, status, notification_emails, notes)
                    VALUES (:br, :pid, :qtp, :sb, 'planifie', :ne, :nt)
                ");
                $stmt->bindValue(':br', $batchReference);
                $stmt->bindValue(':pid', $data['product_id'], PDO::PARAM_INT);
                $stmt->bindValue(':qtp', $data['quantity_to_produce'], PDO::PARAM_INT);
                $stmt->bindValue(':sb', $sizes_breakdown);
                $stmt->bindValue(':ne', $notification_emails);
                $stmt->bindValue(':nt', $notes);
                $stmt->execute();

                $id = $db->lastInsertId();
                
                // Add initial status history record
                try {
                    $historyStmt = $db->prepare("
                        INSERT INTO batch_status_history 
                        (batch_id, old_status, new_status, changed_by, comments) 
                        VALUES (?, NULL, 'planifie', 'System', 'Batch created')
                    ");
                    $historyStmt->execute([$id]);
                } catch (Exception $e) {
                    error_log("Failed to create initial status history: " . $e->getMessage());
                }
                
                echo json_encode(['success' => true, 'message' => 'Batch créé', 'id' => $id, 'batch_reference' => $batchReference]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                break;
            }

            if (isset($data['action']) && $data['action'] === 'cancel_batch') {
                if (empty($data['cancellation_reason'])) {
                    echo json_encode(['success' => false, 'message' => 'Raison d\'annulation requise']);
                    break;
                }

                $stmt = $db->prepare("
                    UPDATE production_batches 
                    SET status = 'cancelled', 
                        cancelled_at = NOW(), 
                        cancelled_by = 1, 
                        cancellation_reason = :reason,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
                $stmt->bindValue(':reason', $data['cancellation_reason']);
                $stmt->execute();

                echo json_encode(['success' => true, 'message' => 'Batch annulé avec succès']);
            } else if (isset($data['action']) && $data['action'] === 'update_status') {
                $sql = ($data['status'] === 'termine')
                    ? "UPDATE production_batches SET status = :st, completed_at = NOW() WHERE id = :id"
                    : "UPDATE production_batches SET status = :st WHERE id = :id";

                $stmt = $db->prepare($sql);
                $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
                $stmt->bindValue(':st', $data['status']);
                $stmt->execute();

                echo json_encode(['success' => true, 'message' => 'Statut mis à jour']);
            } else {
                $sizes_breakdown = $data['sizes_breakdown'] ?? null;
                $notification_emails = $data['notification_emails'] ?? null;
                $notes = $data['notes'] ?? null;

                $stmt = $db->prepare("
                    UPDATE production_batches
                    SET quantity_to_produce = :qtp,
                        sizes_breakdown = :sb,
                        notification_emails = :ne,
                        notes = :nt,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
                $stmt->bindValue(':qtp', $data['quantity_to_produce'], PDO::PARAM_INT);
                $stmt->bindValue(':sb', $sizes_breakdown);
                $stmt->bindValue(':ne', $notification_emails);
                $stmt->bindValue(':nt', $notes);
                $stmt->execute();

                echo json_encode(['success' => true, 'message' => 'Batch mis à jour']);
            }
            break;

        case 'DELETE':
            if (empty($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                break;
            }
            $stmt = $db->prepare("DELETE FROM production_batches WHERE id = :id");
            $stmt->bindValue(':id', $_GET['id'], PDO::PARAM_INT);
            $stmt->execute();

            echo json_encode(['success' => true, 'message' => 'Batch supprimé']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
