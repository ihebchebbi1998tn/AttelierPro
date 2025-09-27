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
                // Get time entries for specific employee
                $where = "WHERE t.employee_id = ?";
                $params = [$_GET['employee_id']];
                
                if (isset($_GET['date_start']) && isset($_GET['date_end'])) {
                    $where .= " AND t.date BETWEEN ? AND ?";
                    $params[] = $_GET['date_start'];
                    $params[] = $_GET['date_end'];
                } elseif (isset($_GET['date'])) {
                    $where .= " AND t.date = ?";
                    $params[] = $_GET['date'];
                }
                
                $sql = "
                    SELECT t.*, e.nom, e.prenom 
                    FROM production_time_entries t
                    JOIN production_employees e ON t.employee_id = e.id
                    $where
                    ORDER BY t.date DESC
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $timeEntries = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $timeEntries]);
            } else {
                // Get all time entries with optional filters
                $where = "";
                $params = [];
                
                if (isset($_GET['date_start']) && isset($_GET['date_end'])) {
                    $where = "WHERE t.date BETWEEN ? AND ?";
                    $params = [$_GET['date_start'], $_GET['date_end']];
                } elseif (isset($_GET['date'])) {
                    $where = "WHERE t.date = ?";
                    $params = [$_GET['date']];
                }
                
                $sql = "
                    SELECT t.*, e.nom, e.prenom 
                    FROM production_time_entries t
                    JOIN production_employees e ON t.employee_id = e.id
                    $where
                    ORDER BY t.date DESC, e.nom, e.prenom
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $timeEntries = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $timeEntries]);
            }
            break;
            
        case 'POST':
            // Create new time entry
            if (empty($input['employee_id']) || empty($input['date'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID et date sont obligatoires']);
                break;
            }
            
            // Calculate total hours if clock_in and clock_out are provided
            $totalHours = null;
            if (!empty($input['clock_in']) && !empty($input['clock_out'])) {
                $clockIn = new DateTime($input['clock_in']);
                $clockOut = new DateTime($input['clock_out']);
                $totalMinutes = $clockOut->getTimestamp() - $clockIn->getTimestamp();
                
                // Subtract lunch time if provided
                if (!empty($input['lunch_start']) && !empty($input['lunch_end'])) {
                    $lunchStart = new DateTime($input['lunch_start']);
                    $lunchEnd = new DateTime($input['lunch_end']);
                    $lunchMinutes = $lunchEnd->getTimestamp() - $lunchStart->getTimestamp();
                    $totalMinutes -= $lunchMinutes;
                }
                
                $totalHours = round($totalMinutes / 3600, 2);
            } else {
                $totalHours = $input['total_hours'] ?? null;
            }
            
            $stmt = $db->prepare("
                INSERT INTO production_time_entries (employee_id, date, clock_in, clock_out, lunch_start, lunch_end, total_hours, overtime_hours, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                clock_in = VALUES(clock_in),
                clock_out = VALUES(clock_out),
                lunch_start = VALUES(lunch_start),
                lunch_end = VALUES(lunch_end),
                total_hours = VALUES(total_hours),
                overtime_hours = VALUES(overtime_hours),
                note = VALUES(note)
            ");
            
            $result = $stmt->execute([
                $input['employee_id'],
                $input['date'],
                $input['clock_in'] ?? null,
                $input['clock_out'] ?? null,
                $input['lunch_start'] ?? null,
                $input['lunch_end'] ?? null,
                $totalHours,
                $input['overtime_hours'] ?? 0,
                $input['note'] ?? null
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Temps de travail enregistré avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
            }
            break;
            
        case 'PUT':
            // Update time entry
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            // Recalculate total hours if needed
            $totalHours = $input['total_hours'] ?? null;
            if (!empty($input['clock_in']) && !empty($input['clock_out'])) {
                $clockIn = new DateTime($input['clock_in']);
                $clockOut = new DateTime($input['clock_out']);
                $totalMinutes = $clockOut->getTimestamp() - $clockIn->getTimestamp();
                
                if (!empty($input['lunch_start']) && !empty($input['lunch_end'])) {
                    $lunchStart = new DateTime($input['lunch_start']);
                    $lunchEnd = new DateTime($input['lunch_end']);
                    $lunchMinutes = $lunchEnd->getTimestamp() - $lunchStart->getTimestamp();
                    $totalMinutes -= $lunchMinutes;
                }
                
                $totalHours = round($totalMinutes / 3600, 2);
            }
            
            $stmt = $db->prepare("
                UPDATE production_time_entries 
                SET clock_in = ?, clock_out = ?, lunch_start = ?, lunch_end = ?, total_hours = ?, overtime_hours = ?, note = ?
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $input['clock_in'] ?? null,
                $input['clock_out'] ?? null,
                $input['lunch_start'] ?? null,
                $input['lunch_end'] ?? null,
                $totalHours,
                $input['overtime_hours'] ?? 0,
                $input['note'] ?? null,
                $_GET['id']
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Temps de travail mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
            break;
            
        case 'DELETE':
            // Delete time entry
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_time_entries WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Temps de travail supprimé avec succès']);
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