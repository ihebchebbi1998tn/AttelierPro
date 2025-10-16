<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method !== 'GET') {
        echo json_encode(['success' => false, 'message' => 'Seule la méthode GET est supportée']);
        exit;
    }
    
    $type = $_GET['type'] ?? 'overview';
    $period = $_GET['period'] ?? 'month';
    $year = $_GET['year'] ?? date('Y');
    $month = $_GET['month'] ?? date('m');
    
    switch ($type) {
        case 'overview':
            // Get general statistics
            $stats = [];
            
            // Total employees
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM production_employees");
            $stmt->execute();
            $stats['total_employees'] = $stmt->fetch()['total'];
            
            // Active employees
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM production_employees WHERE actif = 1");
            $stmt->execute();
            $stats['active_employees'] = $stmt->fetch()['total'];
            
            // Pending holiday requests
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM production_holidays WHERE status = 'pending'");
            $stmt->execute();
            $stats['pending_holidays'] = $stmt->fetch()['total'];
            
            // Employees on holiday today (approved holidays for today's date)
            $stmt = $db->prepare("
                SELECT COUNT(DISTINCT employee_id) as total 
                FROM production_holidays 
                WHERE status = 'approved' 
                AND date = CURDATE()
            ");
            $stmt->execute();
            $stats['on_holiday_today'] = $stmt->fetch()['total'];
            
            // Regions count
            $stmt = $db->prepare("SELECT COUNT(DISTINCT region) as total FROM production_employees WHERE region IS NOT NULL");
            $stmt->execute();
            $stats['regions_count'] = $stmt->fetch()['total'];
            
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
            
        case 'hours':
            // Get hours statistics
            $dateFilter = "";
            $params = [];
            
            if ($period === 'month') {
                $dateFilter = "WHERE YEAR(date) = ? AND MONTH(date) = ?";
                $params = [$year, $month];
            } elseif ($period === 'year') {
                $dateFilter = "WHERE YEAR(date) = ?";
                $params = [$year];
            }
            
            $sql = "
                SELECT 
                    e.id,
                    e.nom,
                    e.prenom,
                    COALESCE(SUM(t.total_hours), 0) as total_hours,
                    COALESCE(SUM(t.overtime_hours), 0) as overtime_hours,
                    COUNT(t.id) as days_worked
                FROM production_employees e
                LEFT JOIN production_time_entries t ON e.id = t.employee_id $dateFilter
                WHERE e.actif = 1
                GROUP BY e.id, e.nom, e.prenom
                ORDER BY total_hours DESC
            ";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $hoursStats = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $hoursStats]);
            break;
            
        case 'salaries':
            // Get salary statistics
            $sql = "
                SELECT 
                    e.id,
                    e.nom,
                    e.prenom,
                    s.net_total,
                    s.brut_total,
                    s.taxes,
                    s.effective_from
                FROM production_employees e
                JOIN production_salaries s ON e.id = s.employee_id
                WHERE e.actif = 1 
                AND (s.effective_to IS NULL OR s.effective_to >= CURDATE())
                ORDER BY s.net_total DESC
            ";
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $salaryStats = $stmt->fetchAll();
            
            // Calculate totals
            $totalNet = array_sum(array_column($salaryStats, 'net_total'));
            $totalBrut = array_sum(array_column($salaryStats, 'brut_total'));
            $totalTaxes = array_sum(array_column($salaryStats, 'taxes'));
            
            $result = [
                'employees' => $salaryStats,
                'totals' => [
                    'net_total' => $totalNet,
                    'brut_total' => $totalBrut,
                    'taxes_total' => $totalTaxes
                ]
            ];
            
            echo json_encode(['success' => true, 'data' => $result]);
            break;
            
        case 'attendance':
            // Get attendance statistics
            $dateFilter = "";
            $params = [];
            
            if ($period === 'month') {
                $dateFilter = "WHERE YEAR(date) = ? AND MONTH(date) = ?";
                $params = [$year, $month];
            } elseif ($period === 'year') {
                $dateFilter = "WHERE YEAR(date) = ?";
                $params = [$year];
            }
            
            // Get working days
            $workingDaysSql = "
                SELECT 
                    e.id,
                    e.nom,
                    e.prenom,
                    COUNT(DISTINCT t.date) as days_worked
                FROM production_employees e
                LEFT JOIN production_time_entries t ON e.id = t.employee_id $dateFilter
                WHERE e.actif = 1
                GROUP BY e.id, e.nom, e.prenom
            ";
            
            $stmt = $db->prepare($workingDaysSql);
            $stmt->execute($params);
            $workingDays = $stmt->fetchAll();
            
            // Get holidays
            $holidaysSql = "
                SELECT 
                    e.id,
                    COUNT(h.id) as holiday_days
                FROM production_employees e
                LEFT JOIN production_holidays h ON e.id = h.employee_id 
                AND h.status = 'approved' $dateFilter
                WHERE e.actif = 1
                GROUP BY e.id
            ";
            
            $stmt = $db->prepare($holidaysSql);
            $stmt->execute($params);
            $holidays = $stmt->fetchAll();
            
            // Merge data
            $attendanceStats = [];
            foreach ($workingDays as $work) {
                $holiday = array_filter($holidays, function($h) use ($work) {
                    return $h['id'] == $work['id'];
                });
                $holidayDays = !empty($holiday) ? array_values($holiday)[0]['holiday_days'] : 0;
                
                $attendanceStats[] = [
                    'id' => $work['id'],
                    'nom' => $work['nom'],
                    'prenom' => $work['prenom'],
                    'days_worked' => $work['days_worked'],
                    'holiday_days' => $holidayDays
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $attendanceStats]);
            break;
            
        case 'regions':
            // Get statistics by region
            $sql = "
                SELECT 
                    region,
                    COUNT(*) as employee_count,
                    SUM(CASE WHEN actif = 1 THEN 1 ELSE 0 END) as active_count
                FROM production_employees 
                WHERE region IS NOT NULL
                GROUP BY region
                ORDER BY employee_count DESC
            ";
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $regionStats = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $regionStats]);
            break;
            
        case 'monthly_hours':
            // Get monthly hours for chart
            $sql = "
                SELECT 
                    MONTH(date) as month,
                    YEAR(date) as year,
                    SUM(total_hours) as total_hours,
                    SUM(overtime_hours) as overtime_hours
                FROM production_time_entries 
                WHERE YEAR(date) = ?
                GROUP BY YEAR(date), MONTH(date)
                ORDER BY YEAR(date), MONTH(date)
            ";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([$year]);
            $monthlyHours = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $monthlyHours]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Type de statistique non supporté']);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>