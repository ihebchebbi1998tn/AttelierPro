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
                    SELECT 
                        s.*,
                        e.nom, 
                        e.prenom,
                        e.chef_de_famille,
                        e.nombre_enfants
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
                    SELECT 
                        s.*,
                        e.nom, 
                        e.prenom,
                        e.chef_de_famille,
                        e.nombre_enfants
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
            // Create new salary entry with Tunisian calculation using dynamic config
            if (empty($input['employee_id']) || empty($input['salaire_brut']) || empty($input['effective_from'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID, salaire brut et date sont obligatoires']);
                break;
            }
            
            // Get employee data for calculations
            $stmt = $db->prepare("SELECT chef_de_famille, nombre_enfants FROM production_employees WHERE id = ?");
            $stmt->execute([$input['employee_id']]);
            $employee = $stmt->fetch();
            
            if (!$employee) {
                echo json_encode(['success' => false, 'message' => 'Employé non trouvé']);
                break;
            }
            
            // Load dynamic salary configuration
            $configStmt = $db->prepare("SELECT config_key, config_value FROM production_salary_config");
            $configStmt->execute();
            $configRows = $configStmt->fetchAll();
            $config = [];
            foreach ($configRows as $row) {
                $config[$row['config_key']] = floatval($row['config_value']);
            }
            
            // Load tax brackets
            $bracketsStmt = $db->prepare("SELECT * FROM production_tax_brackets WHERE active = 1 ORDER BY bracket_order");
            $bracketsStmt->execute();
            $taxBrackets = $bracketsStmt->fetchAll();
            
            // Use provided values or employee defaults
            $chef_de_famille = $input['chef_de_famille'] ?? ($employee['chef_de_famille'] == 1);
            $nombre_enfants = $input['nombre_enfants'] ?? intval($employee['nombre_enfants']);
            $salaire_brut = floatval($input['salaire_brut']);
            
            // Get config values with defaults
            $cnss_rate = $config['cnss_rate'] ?? 0.0968;
            $css_rate = $config['css_rate'] ?? 0.01;
            $deduction_chef = ($config['deduction_chef_famille'] ?? 150) * ($chef_de_famille ? 1 : 0);
            $deduction_enfants = ($config['deduction_per_child'] ?? 100) * $nombre_enfants;
            
            // Calculate all components according to Tunisian law 2025
            $cnss = round($salaire_brut * $cnss_rate, 3);
            $salaire_brut_imposable = round($salaire_brut - $cnss, 3);
            
            // Calculate base imposable
            $base_imposable = max(0, $salaire_brut_imposable - $deduction_chef - $deduction_enfants);
            
            // Calculate IRPP using dynamic tax brackets
            $irpp = 0;
            foreach ($taxBrackets as $i => $bracket) {
                $prevMax = $i > 0 ? floatval($taxBrackets[$i - 1]['max_amount'] ?? $taxBrackets[$i - 1]['min_amount']) : 0;
                
                if ($base_imposable <= $prevMax) {
                    break;
                }
                
                $maxInBracket = $bracket['max_amount'] !== null ? floatval($bracket['max_amount']) : PHP_FLOAT_MAX;
                $taxableInBracket = min($base_imposable - $prevMax, $maxInBracket - $prevMax);
                
                $irpp += $taxableInBracket * floatval($bracket['tax_rate']);
            }
            $irpp = round($irpp, 3);
            
            // CSS (1% solidarity contribution)
            $css = round($salaire_brut_imposable * $css_rate, 3);
            
            // Final net salary
            $salaire_net = round($salaire_brut - $cnss - $irpp - $css, 3);
            
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
                
                // Insert new salary entry with full breakdown
                $stmt = $db->prepare("
                    INSERT INTO production_salaries (
                        employee_id, 
                        salaire_brut, 
                        cnss, 
                        salaire_brut_imposable, 
                        irpp, 
                        css, 
                        salaire_net,
                        net_total,
                        brut_total,
                        taxes,
                        effective_from, 
                        note
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $result = $stmt->execute([
                    $input['employee_id'],
                    $salaire_brut,
                    $cnss,
                    $salaire_brut_imposable,
                    $irpp,
                    $css,
                    $salaire_net,
                    $salaire_net, // Legacy field
                    $salaire_brut, // Legacy field
                    $irpp + $css, // Legacy field (total taxes)
                    $input['effective_from'],
                    $input['note'] ?? null
                ]);
                
                if ($result) {
                    $db->commit();
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Salaire enregistré avec succès',
                        'data' => [
                            'salaire_brut' => $salaire_brut,
                            'cnss' => $cnss,
                            'salaire_brut_imposable' => $salaire_brut_imposable,
                            'irpp' => $irpp,
                            'css' => $css,
                            'salaire_net' => $salaire_net
                        ]
                    ]);
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