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
                // Get holidays for specific employee
                $where = "WHERE h.employee_id = ?";
                $params = [$_GET['employee_id']];
                
                if (isset($_GET['status']) && $_GET['status'] !== 'all') {
                    $where .= " AND h.status = ?";
                    $params[] = $_GET['status'];
                }
                
                if (isset($_GET['year'])) {
                    $where .= " AND YEAR(h.date) = ?";
                    $params[] = $_GET['year'];
                }
                
                $sql = "
                    SELECT h.*, e.nom, e.prenom,
                           cb.nom as created_by_nom, cb.prenom as created_by_prenom,
                           ap.nom as approved_by_nom, ap.prenom as approved_by_prenom
                    FROM production_holidays h
                    JOIN production_employees e ON h.employee_id = e.id
                    LEFT JOIN production_employees cb ON h.created_by = cb.id
                    LEFT JOIN production_employees ap ON h.approved_by = ap.id
                    $where
                    ORDER BY h.date DESC
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $holidays = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $holidays]);
            } else {
                // Get all holidays with filters
                $where = "";
                $params = [];
                
                if (isset($_GET['status']) && $_GET['status'] !== 'all') {
                    $where = "WHERE h.status = ?";
                    $params[] = $_GET['status'];
                }
                
                if (isset($_GET['date_start']) && isset($_GET['date_end'])) {
                    $whereClause = empty($where) ? "WHERE" : " AND";
                    $where .= "$whereClause h.date BETWEEN ? AND ?";
                    $params[] = $_GET['date_start'];
                    $params[] = $_GET['date_end'];
                }
                
                $sql = "
                    SELECT h.*, e.nom, e.prenom,
                           cb.nom as created_by_nom, cb.prenom as created_by_prenom,
                           ap.nom as approved_by_nom, ap.prenom as approved_by_prenom
                    FROM production_holidays h
                    JOIN production_employees e ON h.employee_id = e.id
                    LEFT JOIN production_employees cb ON h.created_by = cb.id
                    LEFT JOIN production_employees ap ON h.approved_by = ap.id
                    $where
                    ORDER BY h.date DESC, e.nom, e.prenom
                ";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $holidays = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $holidays]);
            }
            break;
            
        case 'POST':
            // Create new holiday request
            if (empty($input['employee_id']) || empty($input['date'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID et date sont obligatoires']);
                break;
            }
            
            $stmt = $db->prepare("
                INSERT INTO production_holidays (employee_id, date, half_day, motif, status, created_by) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['employee_id'],
                $input['date'],
                $input['half_day'] ?? 'FULL',
                $input['motif'] ?? null,
                $input['status'] ?? 'pending',
                $input['created_by'] ?? null
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Demande de congé créée avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
            }
            break;
            
        case 'PUT':
            // Update holiday request
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            // Check if it's a status update (approval/rejection)
            if (isset($input['status']) && in_array($input['status'], ['approved', 'rejected'])) {
                $stmt = $db->prepare("
                    UPDATE production_holidays 
                    SET status = ?, approved_by = ?, approved_at = NOW()
                    WHERE id = ?
                ");
                
                $result = $stmt->execute([
                    $input['status'],
                    $input['approved_by'] ?? null,
                    $_GET['id']
                ]);
                
                $message = $input['status'] === 'approved' ? 'Congé approuvé' : 'Congé refusé';
            } else {
                // Regular update
                $stmt = $db->prepare("
                    UPDATE production_holidays 
                    SET date = ?, half_day = ?, motif = ?, status = ?
                    WHERE id = ?
                ");
                
                $result = $stmt->execute([
                    $input['date'],
                    $input['half_day'] ?? 'FULL',
                    $input['motif'] ?? null,
                    $input['status'] ?? 'pending',
                    $_GET['id']
                ]);
                
                $message = 'Demande de congé mise à jour avec succès';
            }
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => $message]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
            break;
            
        case 'DELETE':
            // Delete holiday request
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_holidays WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Demande de congé supprimée avec succès']);
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