<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['employee_id'])) {
                // Get salaries for specific employee
                $where = "WHERE s.employee_id = ?";
                $params = [$_GET['employee_id']];
                
                if (isset($_GET['current']) && $_GET['current'] === 'true') {
                    $where .= " AND (s.effective_to IS NULL OR s.effective_to >= CURDATE())";
                }
                
                $sql = "
                    SELECT s.*, e.nom, e.prenom 
                    FROM production_salaries s
                    JOIN production_employees e ON s.employee_id = e.id
                    $where
                    ORDER BY s.effective_from DESC
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $salaries = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $salaries]);
            } else {
                // Get all salaries (not just current ones)
                $sql = "
                    SELECT s.*, e.nom, e.prenom 
                    FROM production_salaries s
                    JOIN production_employees e ON s.employee_id = e.id
                    ORDER BY e.nom, e.prenom, s.effective_from DESC
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute();
                $salaries = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $salaries]);
            }
            break;
            
        case 'POST':
            // Create new salary entry
            if (empty($input['employee_id']) || empty($input['net_total']) || empty($input['effective_from'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID, salaire net et date sont obligatoires']);
                break;
            }
            
            // Start transaction
            $db->beginTransaction();
            
            try {
                // Close previous salary entry if exists
                $stmt = $db->prepare("
                    UPDATE production_salaries 
                    SET effective_to = DATE_SUB(?, INTERVAL 1 DAY)
                    WHERE employee_id = ? AND (effective_to IS NULL OR effective_to >= ?)
                ");
                $stmt->execute([
                    $input['effective_from'],
                    $input['employee_id'],
                    $input['effective_from']
                ]);
                
                // Insert new salary entry
                $stmt = $db->prepare("
                    INSERT INTO production_salaries (employee_id, net_total, brut_total, taxes, effective_from, note) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $input['employee_id'],
                    $input['net_total'],
                    $input['brut_total'] ?? null,
                    $input['taxes'] ?? null,
                    $input['effective_from'],
                    $input['note'] ?? null
                ]);
                
                if ($result) {
                    $db->commit();
                    echo json_encode(['success' => true, 'message' => 'Salaire enregistré avec succès']);
                } else {
                    $db->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
                }
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        case 'PUT':
            // Update salary entry
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE production_salaries 
                SET net_total = ?, brut_total = ?, taxes = ?, effective_from = ?, effective_to = ?, note = ?
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $input['net_total'],
                $input['brut_total'] ?? null,
                $input['taxes'] ?? null,
                $input['effective_from'],
                $input['effective_to'] ?? null,
                $input['note'] ?? null,
                $_GET['id']
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Salaire mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
            break;
            
        case 'DELETE':
            // Delete salary entry
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_salaries WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Entrée de salaire supprimée avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>