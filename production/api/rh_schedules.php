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
                // Get schedules for specific employee
                $where = "WHERE employee_id = ?";
                $params = [$_GET['employee_id']];
                
                if (isset($_GET['date_start']) && isset($_GET['date_end'])) {
                    $where .= " AND date BETWEEN ? AND ?";
                    $params[] = $_GET['date_start'];
                    $params[] = $_GET['date_end'];
                } elseif (isset($_GET['date'])) {
                    $where .= " AND date = ?";
                    $params[] = $_GET['date'];
                }
                
                $sql = "
                    SELECT s.*, e.nom, e.prenom 
                    FROM production_schedules s
                    JOIN production_employees e ON s.employee_id = e.id
                    $where
                    ORDER BY date DESC
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $schedules = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $schedules]);
            } else {
                // Get all schedules with optional date filter
                $where = "";
                $params = [];
                
                if (isset($_GET['date_start']) && isset($_GET['date_end'])) {
                    $where = "WHERE s.date BETWEEN ? AND ?";
                    $params = [$_GET['date_start'], $_GET['date_end']];
                } elseif (isset($_GET['date'])) {
                    $where = "WHERE s.date = ?";
                    $params = [$_GET['date']];
                }
                
                $sql = "
                    SELECT s.*, e.nom, e.prenom 
                    FROM production_schedules s
                    JOIN production_employees e ON s.employee_id = e.id
                    $where
                    ORDER BY s.date DESC, e.nom, e.prenom
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $schedules = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $schedules]);
            }
            break;
            
        case 'POST':
            // Create new schedule
            if (empty($input['employee_id']) || empty($input['date'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID et date sont obligatoires']);
                break;
            }
            
            $stmt = $db->prepare("
                INSERT INTO production_schedules (employee_id, date, start_time, end_time, lunch_start, lunch_end, is_half_day, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                start_time = VALUES(start_time),
                end_time = VALUES(end_time),
                lunch_start = VALUES(lunch_start),
                lunch_end = VALUES(lunch_end),
                is_half_day = VALUES(is_half_day),
                note = VALUES(note)
            ");
            
            $result = $stmt->execute([
                $input['employee_id'],
                $input['date'],
                $input['start_time'] ?? null,
                $input['end_time'] ?? null,
                $input['lunch_start'] ?? null,
                $input['lunch_end'] ?? null,
                $input['is_half_day'] ?? 0,
                $input['note'] ?? null
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Planning créé/mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
            }
            break;
            
        case 'PUT':
            // Update schedule
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE production_schedules 
                SET start_time = ?, end_time = ?, lunch_start = ?, lunch_end = ?, is_half_day = ?, note = ?
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $input['start_time'] ?? null,
                $input['end_time'] ?? null,
                $input['lunch_start'] ?? null,
                $input['lunch_end'] ?? null,
                $input['is_half_day'] ?? 0,
                $input['note'] ?? null,
                $_GET['id']
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Planning mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
            break;
            
        case 'DELETE':
            // Delete schedule
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_schedules WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Planning supprimé avec succès']);
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