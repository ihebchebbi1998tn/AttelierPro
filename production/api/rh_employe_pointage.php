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
            // Expect payload: { rows: [ { employee_id, month, emp_no, matricule, prenom, nom, ... } ] }
            if (empty($input['rows']) || !is_array($input['rows'])) {
                echo json_encode(['success' => false, 'message' => 'Payload invalide']);
                break;
            }

            $rows = $input['rows'];
            $db->beginTransaction();
            
            $insertStmt = $db->prepare("
                INSERT INTO production_employe_pointage (
                    employee_id, month, emp_no, matricule, prenom, nom, jr_repos, 
                    date, horaire, debut, fin, entree, sortie, 
                    jr_normalement_trv, jr_travaille, retard, depart_anticipe, absent, h_sup,
                    presence_planning, motif, ptg_entree_obligatoire, ptg_sortie_obligatoire,
                    departement, ndays, weekend, holiday, presence_reelle,
                    weekend_ot, ndays_ot, holiday_ot, sspe_day_holiday_ot,
                    jr_travaille_count, absent_count
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                ) ON DUPLICATE KEY UPDATE
                    month = VALUES(month),
                    emp_no = VALUES(emp_no),
                    matricule = VALUES(matricule),
                    prenom = VALUES(prenom),
                    nom = VALUES(nom),
                    jr_repos = VALUES(jr_repos),
                    date = VALUES(date),
                    horaire = VALUES(horaire),
                    debut = VALUES(debut),
                    fin = VALUES(fin),
                    entree = VALUES(entree),
                    sortie = VALUES(sortie),
                    jr_normalement_trv = VALUES(jr_normalement_trv),
                    jr_travaille = VALUES(jr_travaille),
                    retard = VALUES(retard),
                    depart_anticipe = VALUES(depart_anticipe),
                    absent = VALUES(absent),
                    h_sup = VALUES(h_sup),
                    presence_planning = VALUES(presence_planning),
                    motif = VALUES(motif),
                    ptg_entree_obligatoire = VALUES(ptg_entree_obligatoire),
                    ptg_sortie_obligatoire = VALUES(ptg_sortie_obligatoire),
                    departement = VALUES(departement),
                    ndays = VALUES(ndays),
                    weekend = VALUES(weekend),
                    holiday = VALUES(holiday),
                    presence_reelle = VALUES(presence_reelle),
                    weekend_ot = VALUES(weekend_ot),
                    ndays_ot = VALUES(ndays_ot),
                    holiday_ot = VALUES(holiday_ot),
                    sspe_day_holiday_ot = VALUES(sspe_day_holiday_ot),
                    jr_travaille_count = VALUES(jr_travaille_count),
                    absent_count = VALUES(absent_count),
                    updated_at = CURRENT_TIMESTAMP
            ");

            foreach ($rows as $r) {
                $employeeId = isset($r['employee_id']) ? intval($r['employee_id']) : null;
                $month = isset($r['month']) ? $r['month'] : null;
                
                if (!$employeeId || !$month) continue;

                // Extract all fields from the row
                $empNo = $r['emp_no'] ?? null;
                $matricule = $r['matricule'] ?? null;
                $prenom = $r['prenom'] ?? null;
                $nom = $r['nom'] ?? null;
                $jrRepos = $r['jr_repos'] ?? null;
                $date = $r['date'] ?? null;
                $horaire = $r['horaire'] ?? null;
                $debut = $r['debut'] ?? null;
                $fin = $r['fin'] ?? null;
                $entree = $r['entree'] ?? null;
                $sortie = $r['sortie'] ?? null;
                $jrNormalementTrv = isset($r['jr_normalement_trv']) ? floatval($r['jr_normalement_trv']) : 0;
                $jrTravaille = isset($r['jr_travaille']) ? floatval($r['jr_travaille']) : 0;
                $retard = isset($r['retard']) ? floatval($r['retard']) : 0;
                $departAnticipe = isset($r['depart_anticipe']) ? floatval($r['depart_anticipe']) : 0;
                $absent = isset($r['absent']) ? floatval($r['absent']) : 0;
                $hSup = isset($r['h_sup']) ? floatval($r['h_sup']) : 0;
                $presencePlanning = $r['presence_planning'] ?? null;
                $motif = $r['motif'] ?? null;
                $ptgEntreeObligatoire = $r['ptg_entree_obligatoire'] ?? null;
                $ptgSortieObligatoire = $r['ptg_sortie_obligatoire'] ?? null;
                $departement = $r['departement'] ?? null;
                $ndays = isset($r['ndays']) ? floatval($r['ndays']) : 0;
                $weekend = isset($r['weekend']) ? floatval($r['weekend']) : 0;
                $holiday = isset($r['holiday']) ? floatval($r['holiday']) : 0;
                $presenceReelle = $r['presence_reelle'] ?? null;
                $weekendOt = isset($r['weekend_ot']) ? floatval($r['weekend_ot']) : 0;
                $ndaysOt = isset($r['ndays_ot']) ? floatval($r['ndays_ot']) : 0;
                $holidayOt = isset($r['holiday_ot']) ? floatval($r['holiday_ot']) : 0;
                $sspeDayHolidayOt = isset($r['sspe_day_holiday_ot']) ? floatval($r['sspe_day_holiday_ot']) : 0;
                
                // Legacy count fields
                $jrTravailleCount = isset($r['jr_travaille_count']) ? intval($r['jr_travaille_count']) : intval($jrTravaille);
                $absentCount = isset($r['absent_count']) ? intval($r['absent_count']) : intval($absent);

                $insertStmt->execute([
                    $employeeId, $month, $empNo, $matricule, $prenom, $nom, $jrRepos,
                    $date, $horaire, $debut, $fin, $entree, $sortie,
                    $jrNormalementTrv, $jrTravaille, $retard, $departAnticipe, $absent, $hSup,
                    $presencePlanning, $motif, $ptgEntreeObligatoire, $ptgSortieObligatoire,
                    $departement, $ndays, $weekend, $holiday, $presenceReelle,
                    $weekendOt, $ndaysOt, $holidayOt, $sspeDayHolidayOt,
                    $jrTravailleCount, $absentCount
                ]);
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
