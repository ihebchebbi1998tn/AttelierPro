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
                // Get shift templates for specific employee
                $sql = "
                    SELECT st.*, e.nom, e.prenom 
                    FROM production_shift_templates st
                    JOIN production_employees e ON st.employee_id = e.id
                    WHERE st.employee_id = ? AND st.active = 1
                    ORDER BY st.weekday
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute([$_GET['employee_id']]);
                $templates = $stmt->fetchAll();
                
                // Add weekday names in French
                $weekdays = [
                    0 => 'Dimanche',
                    1 => 'Lundi', 
                    2 => 'Mardi',
                    3 => 'Mercredi',
                    4 => 'Jeudi',
                    5 => 'Vendredi',
                    6 => 'Samedi'
                ];
                
                foreach ($templates as &$template) {
                    $template['weekday_name'] = $weekdays[$template['weekday']];
                }
                
                echo json_encode(['success' => true, 'data' => $templates]);
            } else {
                // Get all shift templates
                $sql = "
                    SELECT st.*, e.nom, e.prenom 
                    FROM production_shift_templates st
                    JOIN production_employees e ON st.employee_id = e.id
                    WHERE st.active = 1
                    ORDER BY e.nom, e.prenom, st.weekday
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute();
                $templates = $stmt->fetchAll();
                
                $weekdays = [
                    0 => 'Dimanche', 1 => 'Lundi', 2 => 'Mardi',
                    3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi'
                ];
                
                foreach ($templates as &$template) {
                    $template['weekday_name'] = $weekdays[$template['weekday']];
                }
                
                echo json_encode(['success' => true, 'data' => $templates]);
            }
            break;
            
        case 'POST':
            // Create new shift template
            if (empty($input['employee_id']) || !isset($input['weekday']) || empty($input['start_time']) || empty($input['end_time'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID, jour, heure début et fin sont obligatoires']);
                break;
            }
            
            // Check if template already exists for this employee and weekday
            $checkStmt = $db->prepare("SELECT id FROM production_shift_templates WHERE employee_id = ? AND weekday = ? AND active = 1");
            $checkStmt->execute([$input['employee_id'], $input['weekday']]);
            
            if ($checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Un template existe déjà pour ce jour']);
                break;
            }
            
            $stmt = $db->prepare("
                INSERT INTO production_shift_templates (employee_id, weekday, start_time, end_time, lunch_start, lunch_end, active) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['employee_id'],
                $input['weekday'],
                $input['start_time'],
                $input['end_time'],
                $input['lunch_start'] ?? null,
                $input['lunch_end'] ?? null,
                $input['active'] ?? 1
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Template d\'horaire créé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
            }
            break;
            
        case 'PUT':
            // Update shift template
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE production_shift_templates 
                SET start_time = ?, end_time = ?, lunch_start = ?, lunch_end = ?, active = ?
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $input['start_time'],
                $input['end_time'],
                $input['lunch_start'] ?? null,
                $input['lunch_end'] ?? null,
                $input['active'] ?? 1,
                $_GET['id']
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Template d\'horaire mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
            break;
            
        case 'DELETE':
            // Delete (deactivate) shift template
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("UPDATE production_shift_templates SET active = 0 WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Template d\'horaire supprimé avec succès']);
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