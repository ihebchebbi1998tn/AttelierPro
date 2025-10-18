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
            // OR for single leave marking: { employee_id, date, leave_type, leave_duration, leave_hours, motif }
            
            // Check if this is a leave marking request
            if (isset($input['mark_leave']) && $input['mark_leave'] === true) {
                // Mark leave for a specific employee on a specific date
                if (empty($input['employee_id']) || empty($input['date'])) {
                    echo json_encode(['success' => false, 'message' => 'Employee ID et date sont obligatoires']);
                    break;
                }
                
                $employeeId = intval($input['employee_id']);
                $date = $input['date'];
                $leaveType = $input['leave_type'] ?? 'annual';
                $leaveDuration = $input['leave_duration'] ?? 'FULL'; // FULL, AM, PM, HOURS
                $leaveHours = isset($input['leave_hours']) ? floatval($input['leave_hours']) : null;
                $motif = $input['motif'] ?? null;
                $isPaidLeave = isset($input['is_paid_leave']) ? intval($input['is_paid_leave']) : 1;
                $leaveStatus = $input['leave_status'] ?? 'approved'; // pending, approved, rejected
                
                // Calculate jr_travaille and absent based on leave duration
                $jrTravaille = 0;
                $absent = 0;
                
                if ($leaveDuration === 'FULL') {
                    $jrTravaille = 0;
                    $absent = 1;
                } elseif ($leaveDuration === 'AM' || $leaveDuration === 'PM') {
                    $jrTravaille = 0.5;
                    $absent = 0.5;
                } elseif ($leaveDuration === 'HOURS' && $leaveHours !== null) {
                    // Assume standard 8-hour workday
                    $standardHours = 8;
                    $absentFraction = $leaveHours / $standardHours;
                    $jrTravaille = max(0, 1 - $absentFraction);
                    $absent = min(1, $absentFraction);
                }
                
                // Get month from date
                $dateObj = new DateTime($date);
                $month = $dateObj->format('Y-m');
                
                // Try to get employee details (fetch only columns that exist in production_employees)
                $empStmt = $db->prepare("SELECT nom, prenom FROM production_employees WHERE id = ?");
                $empStmt->execute([$employeeId]);
                $empData = $empStmt->fetch();
                
                $empNo = null;
                $matricule = null;
                $nom = $empData['nom'] ?? null;
                $prenom = $empData['prenom'] ?? null;
                $departement = null;
                
                // Insert or update pointage record with leave data
                $stmt = $db->prepare("
                    INSERT INTO production_employe_pointage (
                        employee_id, date, month, emp_no, matricule, nom, prenom, departement,
                        jr_normalement_trv, jr_travaille, absent, 
                        leave_type, leave_duration, leave_hours, leave_status, is_paid_leave, motif,
                        jr_travaille_count, absent_count
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    ) ON DUPLICATE KEY UPDATE
                        jr_travaille = VALUES(jr_travaille),
                        absent = VALUES(absent),
                        leave_type = VALUES(leave_type),
                        leave_duration = VALUES(leave_duration),
                        leave_hours = VALUES(leave_hours),
                        leave_status = VALUES(leave_status),
                        is_paid_leave = VALUES(is_paid_leave),
                        motif = VALUES(motif),
                        jr_travaille_count = VALUES(jr_travaille_count),
                        absent_count = VALUES(absent_count),
                        updated_at = CURRENT_TIMESTAMP
                ");
                
                $jrTravailleCount = intval($jrTravaille);
                $absentCount = intval($absent);
                
                $result = $stmt->execute([
                    $employeeId, $date, $month, $empNo, $matricule, $nom, $prenom, $departement,
                    $jrTravaille, $absent,
                    $leaveType, $leaveDuration, $leaveHours, $leaveStatus, $isPaidLeave, $motif,
                    $jrTravailleCount, $absentCount
                ]);
                
                if ($result) {
                    // Update employee table with latest statistics
                    $statsStmt = $db->prepare("
                        SELECT 
                            COALESCE(SUM(jr_travaille), 0) as total_jr_travaille,
                            COALESCE(SUM(absent), 0) as total_absent
                        FROM production_employe_pointage 
                        WHERE employee_id = ? AND month = ?
                    ");
                    $statsStmt->execute([$employeeId, $month]);
                    $stats = $statsStmt->fetch();
                    
                    // Update employee record
                    $updateEmpStmt = $db->prepare("
                        UPDATE production_employees 
                        SET 
                            jr_travaille = ?,
                            absent = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ");
                    $updateEmpStmt->execute([
                        $stats['total_jr_travaille'],
                        $stats['total_absent'],
                        $employeeId
                    ]);
                    
                    echo json_encode(['success' => true, 'message' => 'Congé marqué avec succès dans le pointage']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors du marquage du congé']);
                }
                break;
            }
            
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
                    jr_travaille_count, absent_count,
                    leave_type, leave_duration, leave_hours, leave_status, is_paid_leave
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
                    leave_type = VALUES(leave_type),
                    leave_duration = VALUES(leave_duration),
                    leave_hours = VALUES(leave_hours),
                    leave_status = VALUES(leave_status),
                    is_paid_leave = VALUES(is_paid_leave),
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
                
                // Handle absent field - convert Excel boolean text to decimal
                $absent = 0;
                if (isset($r['absent'])) {
                    $absentValue = $r['absent'];
                    if (is_string($absentValue)) {
                        $absentLower = strtolower(trim($absentValue));
                        if ($absentLower === 'true' || $absentLower === '1') {
                            $absent = 1.0;
                        } elseif ($absentLower === 'false' || $absentLower === '0') {
                            $absent = 0.0;
                        } else {
                            $absent = floatval($absentValue);
                        }
                    } else {
                        $absent = floatval($absentValue);
                    }
                }
                
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
                
                // Leave tracking fields
                $leaveType = $r['leave_type'] ?? null;
                $leaveDuration = $r['leave_duration'] ?? null;
                $leaveHours = isset($r['leave_hours']) ? floatval($r['leave_hours']) : null;
                $leaveStatus = $r['leave_status'] ?? null;
                $isPaidLeave = isset($r['is_paid_leave']) ? intval($r['is_paid_leave']) : 1;

                $insertStmt->execute([
                    $employeeId, $month, $empNo, $matricule, $prenom, $nom, $jrRepos,
                    $date, $horaire, $debut, $fin, $entree, $sortie,
                    $jrNormalementTrv, $jrTravaille, $retard, $departAnticipe, $absent, $hSup,
                    $presencePlanning, $motif, $ptgEntreeObligatoire, $ptgSortieObligatoire,
                    $departement, $ndays, $weekend, $holiday, $presenceReelle,
                    $weekendOt, $ndaysOt, $holidayOt, $sspeDayHolidayOt,
                    $jrTravailleCount, $absentCount,
                    $leaveType, $leaveDuration, $leaveHours, $leaveStatus, $isPaidLeave
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
