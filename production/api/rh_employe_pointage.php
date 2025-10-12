<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            // Optional filters: employee_id and month (month expected in YYYY-MM or legacy english month name)
            $params = [];
            $where = [];

            if (isset($_GET['employee_id']) && $_GET['employee_id'] !== '') {
                $where[] = 'employee_id = ?';
                $params[] = $_GET['employee_id'];
            }

            if (isset($_GET['month']) && $_GET['month'] !== '') {
                $monthParam = $_GET['month'];
                // If month param is in YYYY-MM, also allow matching legacy english month names for backward compatibility
                if (preg_match('/^\d{4}-\d{2}$/', $monthParam)) {
                    // map month number to english month name
                    $parts = explode('-', $monthParam);
                    $year = intval($parts[0]);
                    $mon = intval($parts[1]);
                    $months = [1=>'january','february','march','april','may','june','july','august','september','october','november','december'];
                    $monthName = isset($months[$mon]) ? $months[$mon] : '';

                    if ($monthName !== '') {
                        $where[] = '(month = ? OR month = ?)';
                        $params[] = $monthParam; // YYYY-MM
                        $params[] = $monthName; // legacy name
                    } else {
                        $where[] = 'month = ?';
                        $params[] = $monthParam;
                    }
                } else {
                    // use provided month string directly (legacy behavior)
                    $where[] = 'month = ?';
                    $params[] = $monthParam;
                }
            }

            $whereClause = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));
            $sql = "SELECT * FROM production_employe_pointage $whereClause ORDER BY employee_id, month DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $rows]);
            break;

        case 'POST':
            // Expect payload: { rows: [ { employee_id, month, jr_travaille_count, absent_count } ] }
            if (empty($input['rows']) || !is_array($input['rows'])) {
                echo json_encode(['success' => false, 'message' => 'Payload invalide']);
                break;
            }

            $rows = $input['rows'];
            $db->beginTransaction();
            $insertStmt = $db->prepare("INSERT INTO production_employe_pointage (employee_id, month, jr_travaille_count, absent_count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE jr_travaille_count = VALUES(jr_travaille_count), absent_count = VALUES(absent_count), updated_at = CURRENT_TIMESTAMP");

            foreach ($rows as $r) {
                $employeeId = isset($r['employee_id']) ? intval($r['employee_id']) : null;
                $month = isset($r['month']) ? $r['month'] : null;
                $jr = isset($r['jr_travaille_count']) ? intval($r['jr_travaille_count']) : 0;
                $abs = isset($r['absent_count']) ? intval($r['absent_count']) : 0;

                if (!$employeeId || !$month) continue;

                $insertStmt->execute([$employeeId, $month, $jr, $abs]);
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Pointage importé avec succès']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Méthode non supportée']);
            break;
    }
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}

?>
