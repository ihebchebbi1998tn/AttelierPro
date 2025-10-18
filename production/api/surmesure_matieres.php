<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            if (isset($_GET['commande_id'])) {
                // Get materials for specific surmesure order with details
                $stmt = $db->prepare("
                    SELECT 
                        sm.*,
                        m.nom as material_name,
                        m.description as material_description,
                        m.quantite_stock as material_stock,
                        m.couleur as material_color,
                        m.prix_unitaire as material_price,
                        c.nom as category_name,
                        qt.nom as quantity_type_name,
                        qt.unite as quantity_unit
                    FROM production_surmesure_matieres sm
                    JOIN production_matieres m ON sm.material_id = m.id
                    LEFT JOIN production_matieres_category c ON m.category_id = c.id
                    JOIN production_quantity_types qt ON sm.quantity_type_id = qt.id
                    WHERE sm.commande_id = :commande_id
                    ORDER BY sm.created_at ASC
                ");
                $stmt->bindParam(':commande_id', $_GET['commande_id'], PDO::PARAM_INT);
                $stmt->execute();
                $materials = $stmt->fetchAll();
                
                // Process materials to include proper image URLs
                foreach ($materials as &$material) {
                    $material['material_image_url'] = "https://via.placeholder.com/64x64/64748b/ffffff?text=" . substr($material['material_name'], 0, 3);
                }
                
                echo json_encode(['success' => true, 'data' => $materials]);
            } elseif (isset($_GET['material_id'])) {
                // Get surmesure orders using specific material
                $stmt = $db->prepare("
                    SELECT 
                        sm.*,
                        qt.nom as quantity_type_name,
                        qt.unite as quantity_unit
                    FROM production_surmesure_matieres sm
                    JOIN production_quantity_types qt ON sm.quantity_type_id = qt.id
                    WHERE sm.material_id = :material_id
                    ORDER BY sm.created_at DESC
                ");
                $stmt->bindParam(':material_id', $_GET['material_id'], PDO::PARAM_INT);
                $stmt->execute();
                $orders = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $orders]);
            } else {
                // Get all surmesure material configurations
                $stmt = $db->prepare("
                    SELECT 
                        sm.*,
                        m.nom as material_name,
                        qt.nom as quantity_type_name
                    FROM production_surmesure_matieres sm
                    JOIN production_matieres m ON sm.material_id = m.id
                    JOIN production_quantity_types qt ON sm.quantity_type_id = qt.id
                    ORDER BY sm.created_at DESC
                ");
                $stmt->execute();
                $materials = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $materials]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Action to configure multiple materials for a surmesure order
            if (isset($data['action']) && $data['action'] === 'configure_surmesure_materials') {
                if (!isset($data['commande_id']) || !isset($data['materials'])) {
                    echo json_encode(['success' => false, 'message' => 'commande_id et materials requis']);
                    break;
                }
                
                $db->beginTransaction();
                
                try {
                    // Delete existing configurations for this order
                    $deleteStmt = $db->prepare("DELETE FROM production_surmesure_matieres WHERE commande_id = :commande_id");
                    $commande_id = (int) $data['commande_id'];
                    $deleteStmt->bindParam(':commande_id', $commande_id, PDO::PARAM_INT);
                    if (!$deleteStmt->execute()) {
                        throw new Exception("Failed to delete existing configurations: " . implode(", ", $deleteStmt->errorInfo()));
                    }
                    
                    // Add new material configurations
                    foreach ($data['materials'] as $material) {
                        $insertStmt = $db->prepare("
                            INSERT INTO production_surmesure_matieres 
                            (commande_id, material_id, quantity_needed, quantity_type_id, commentaire) 
                            VALUES (:commande_id, :material_id, :quantity_needed, :quantity_type_id, :commentaire)
                        ");
                        
                        // Ensure proper type conversion
                        $commande_id = (int) $data['commande_id'];
                        $material_id = (int) $material['material_id'];
                        $quantity_needed = (float) $material['quantity_needed'];
                        $quantity_type_id = (int) $material['quantity_type_id'];
                        $commentaire = isset($material['commentaire']) ? (string) $material['commentaire'] : null;
                        
                        $insertStmt->bindParam(':commande_id', $commande_id, PDO::PARAM_INT);
                        $insertStmt->bindParam(':material_id', $material_id, PDO::PARAM_INT);
                        $insertStmt->bindParam(':quantity_needed', $quantity_needed);
                        $insertStmt->bindParam(':quantity_type_id', $quantity_type_id, PDO::PARAM_INT);
                        $insertStmt->bindParam(':commentaire', $commentaire);
                        
                        if (!$insertStmt->execute()) {
                            throw new Exception("Failed to insert material configuration: " . implode(", ", $insertStmt->errorInfo()));
                        }
                    }
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Configuration des matériaux mise à jour avec succès']);
                } catch (Exception $e) {
                    $db->rollback();
                    error_log("Surmesure materials error: " . $e->getMessage());
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la configuration: ' . $e->getMessage()]);
                }
            } else {
                // Add single material to surmesure order
                if (!isset($data['commande_id']) || !isset($data['material_id']) || !isset($data['quantity_needed']) || !isset($data['quantity_type_id'])) {
                    echo json_encode(['success' => false, 'message' => 'Champs requis manquants (commande_id, material_id, quantity_needed, quantity_type_id)']);
                    break;
                }
                
                // Check if this material is already configured for this order
                $checkStmt = $db->prepare("SELECT id FROM production_surmesure_matieres WHERE commande_id = :commande_id AND material_id = :material_id");
                $checkStmt->bindParam(':commande_id', $data['commande_id'], PDO::PARAM_INT);
                $checkStmt->bindParam(':material_id', $data['material_id'], PDO::PARAM_INT);
                $checkStmt->execute();
                
                if ($checkStmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Ce matériau est déjà configuré pour cette commande']);
                    break;
                }
                
                $stmt = $db->prepare("
                    INSERT INTO production_surmesure_matieres 
                    (commande_id, material_id, quantity_needed, quantity_type_id, commentaire) 
                    VALUES (:commande_id, :material_id, :quantity_needed, :quantity_type_id, :commentaire)
                ");
                
                $stmt->bindParam(':commande_id', $data['commande_id'], PDO::PARAM_INT);
                $stmt->bindParam(':material_id', $data['material_id'], PDO::PARAM_INT);
                $stmt->bindParam(':quantity_needed', $data['quantity_needed']);
                $stmt->bindParam(':quantity_type_id', $data['quantity_type_id'], PDO::PARAM_INT);
                $stmt->bindParam(':commentaire', $data['commentaire'] ?? null);
                
                if ($stmt->execute()) {
                    $newId = $db->lastInsertId();
                    echo json_encode(['success' => true, 'message' => 'Matériau ajouté avec succès', 'id' => $newId]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du matériau']);
                }
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE production_surmesure_matieres SET 
                material_id = :material_id,
                quantity_needed = :quantity_needed,
                quantity_type_id = :quantity_type_id,
                commentaire = :commentaire,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            
            $stmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
            $stmt->bindParam(':material_id', $data['material_id'], PDO::PARAM_INT);
            $stmt->bindParam(':quantity_needed', $data['quantity_needed']);
            $stmt->bindParam(':quantity_type_id', $data['quantity_type_id'], PDO::PARAM_INT);
            $stmt->bindParam(':commentaire', $data['commentaire'] ?? null);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Matériau mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour du matériau']);
            }
            break;
            
        case 'DELETE':
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID requis']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_surmesure_matieres WHERE id = :id");
            $stmt->bindParam(':id', $_GET['id'], PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['success' => true, 'message' => 'Matériau supprimé avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Aucun matériau trouvé avec cet ID']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du matériau']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
            break;
    }
} catch(Exception $e) {
    error_log("Surmesure materials API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
