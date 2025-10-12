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
                $stmt = $db->prepare("SELECT * FROM production_employe_pointage WHERE employee_id = ? ORDER BY month DESC");
                $stmt->execute([$_GET['employee_id']]);
                $rows = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $rows]);
            } else {
                $stmt = $db->prepare("SELECT * FROM production_employe_pointage ORDER BY employee_id, month DESC");
                $stmt->execute([]);
                $rows = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $rows]);
            }
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
