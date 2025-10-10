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
            if (isset($_GET['product_id'])) {
                // Récupérer les matériaux pour un produit avec détails
                $stmt = $db->prepare("
                    SELECT 
                        pm.*,
                        m.nom as material_name,
                        m.description as material_description,
                        m.quantite_stock as material_stock,
                        qt.nom as quantity_type_name,
                        qt.unite as quantity_unit
                    FROM production_product_materials pm
                    JOIN production_matieres m ON pm.material_id = m.id
                    JOIN production_quantity_types qt ON pm.quantity_type_id = qt.id
                    WHERE pm.product_id = :product_id
                    ORDER BY pm.created_at ASC
                ");
                $stmt->bindParam(':product_id', $_GET['product_id']);
                $stmt->execute();
                $materials = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $materials]);
            } else {
                // Récupérer tous les liens produit-matériaux
                $stmt = $db->prepare("
                    SELECT 
                        pm.*,
                        p.nom_product,
                        p.reference_product,
                        m.nom as material_name,
                        qt.nom as quantity_type_name
                    FROM production_product_materials pm
                    JOIN production_ready_products p ON pm.product_id = p.id
                    JOIN production_matieres m ON pm.material_id = m.id
                    JOIN production_quantity_types qt ON pm.quantity_type_id = qt.id
                    ORDER BY pm.created_at DESC
                ");
                $stmt->execute();
                $materials = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $materials]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Action spéciale pour configurer plusieurs matériaux d'un coup
            if (isset($data['action']) && $data['action'] === 'configure_product_materials') {
                if (!isset($data['product_id']) || !isset($data['materials'])) {
                    echo json_encode(['success' => false, 'message' => 'product_id et materials requis']);
                    break;
                }
                
                $db->beginTransaction();
                
                try {
                    // Supprimer les anciennes configurations
                    $deleteStmt = $db->prepare("DELETE FROM production_product_materials WHERE product_id = :product_id");
                    $product_id = (int) $data['product_id'];
                    $deleteStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
                    if (!$deleteStmt->execute()) {
                        throw new Exception("Failed to delete existing configurations: " . implode(", ", $deleteStmt->errorInfo()));
                    }
                    
                    // Ajouter les nouvelles configurations
                    foreach ($data['materials'] as $material) {
                        $insertStmt = $db->prepare("
                            INSERT INTO production_product_materials 
                            (product_id, material_id, quantity_needed, quantity_type_id, size_specific, notes, commentaire) 
                            VALUES (:product_id, :material_id, :quantity_needed, :quantity_type_id, :size_specific, :notes, :commentaire)
                        ");
                        
                        // Ensure proper type conversion
                        $product_id = (int) $data['product_id'];
                        $material_id = (int) $material['material_id'];
                        $quantity_needed = (float) $material['quantity_needed'];
                        $quantity_type_id = (int) $material['quantity_type_id'];
                        $size_specific = isset($material['size_specific']) ? (string) $material['size_specific'] : null;
                        $notes = isset($material['notes']) ? (string) $material['notes'] : null;
                        $commentaire = isset($material['commentaire']) ? (string) $material['commentaire'] : null;
                        
                        $insertStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
                        $insertStmt->bindParam(':material_id', $material_id, PDO::PARAM_INT);
                        $insertStmt->bindParam(':quantity_needed', $quantity_needed);
                        $insertStmt->bindParam(':quantity_type_id', $quantity_type_id, PDO::PARAM_INT);
                        $insertStmt->bindParam(':size_specific', $size_specific);
                        $insertStmt->bindParam(':notes', $notes);
                        $insertStmt->bindParam(':commentaire', $commentaire);
                        
                        if (!$insertStmt->execute()) {
                            throw new Exception("Failed to insert material configuration: " . implode(", ", $insertStmt->errorInfo()));
                        }
                    }
                    
                    // Marquer le produit comme configuré
                    $updateStmt = $db->prepare("UPDATE production_ready_products SET materials_configured = 1 WHERE id = :product_id");
                    $updateStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
                    if (!$updateStmt->execute()) {
                        throw new Exception("Failed to update product configuration status: " . implode(", ", $updateStmt->errorInfo()));
                    }
                    
                    // Debug: Verify the update worked
                    $verifyStmt = $db->prepare("SELECT materials_configured FROM production_ready_products WHERE id = :product_id");
                    $verifyStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
                    $verifyStmt->execute();
                    $result = $verifyStmt->fetch();
                    error_log("Updated materials_configured to: " . $result['materials_configured'] . " for product ID: " . $product_id);
                    
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Configuration des matériaux mise à jour avec succès']);
                } catch (Exception $e) {
                    $db->rollback();
                    error_log("Production materials error: " . $e->getMessage());
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la configuration: ' . $e->getMessage()]);
                }
            } else {
                // Ajouter un seul matériau
                if (!isset($data['product_id']) || !isset($data['material_id']) || !isset($data['quantity_needed']) || !isset($data['quantity_type_id'])) {
                    echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
                    break;
                }
                
                $stmt = $db->prepare("
                    INSERT INTO production_product_materials 
                    (product_id, material_id, quantity_needed, quantity_type_id, size_specific, notes, commentaire) 
                    VALUES (:product_id, :material_id, :quantity_needed, :quantity_type_id, :size_specific, :notes, :commentaire)
                ");
                
                $stmt->bindParam(':product_id', $data['product_id']);
                $stmt->bindParam(':material_id', $data['material_id']);
                $stmt->bindParam(':quantity_needed', $data['quantity_needed']);
                $stmt->bindParam(':quantity_type_id', $data['quantity_type_id']);
                $stmt->bindParam(':size_specific', $data['size_specific'] ?? null);
                $stmt->bindParam(':notes', $data['notes'] ?? null);
                $stmt->bindParam(':commentaire', $data['commentaire'] ?? null);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Matériau ajouté avec succès']);
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
                UPDATE production_product_materials SET 
                material_id = :material_id,
                quantity_needed = :quantity_needed,
                quantity_type_id = :quantity_type_id,
                size_specific = :size_specific,
                notes = :notes,
                commentaire = :commentaire,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':material_id', $data['material_id']);
            $stmt->bindParam(':quantity_needed', $data['quantity_needed']);
            $stmt->bindParam(':quantity_type_id', $data['quantity_type_id']);
            $stmt->bindParam(':size_specific', $data['size_specific'] ?? null);
            $stmt->bindParam(':notes', $data['notes'] ?? null);
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
            
            $stmt = $db->prepare("DELETE FROM production_product_materials WHERE id = :id");
            $stmt->bindParam(':id', $_GET['id']);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Matériau supprimé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du matériau']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
            break;
    }
} catch(Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>