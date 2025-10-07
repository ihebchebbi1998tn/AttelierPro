<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['type']) && $_GET['type'] === 'full') {
                // Get complete configuration including tax brackets
                $configSql = "SELECT * FROM production_salary_config ORDER BY config_key";
                $configStmt = $db->prepare($configSql);
                $configStmt->execute();
                $config = $configStmt->fetchAll();
                
                $bracketsSql = "SELECT * FROM production_tax_brackets WHERE active = 1 ORDER BY bracket_order";
                $bracketsStmt = $db->prepare($bracketsSql);
                $bracketsStmt->execute();
                $brackets = $bracketsStmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'config' => $config,
                        'tax_brackets' => $brackets
                    ]
                ]);
            } else {
                // Get simple config only
                $sql = "SELECT * FROM production_salary_config ORDER BY config_key";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                $config = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $config]);
            }
            break;
            
        case 'PUT':
            // Update configuration
            if (isset($_GET['type']) && $_GET['type'] === 'config') {
                // Update a config value
                if (empty($input['config_key']) || !isset($input['config_value'])) {
                    echo json_encode(['success' => false, 'message' => 'config_key et config_value sont obligatoires']);
                    break;
                }
                
                $stmt = $db->prepare("
                    UPDATE production_salary_config 
                    SET config_value = ?, description = ?
                    WHERE config_key = ?
                ");
                
                $result = $stmt->execute([
                    $input['config_value'],
                    $input['description'] ?? null,
                    $input['config_key']
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Configuration mise à jour avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
                }
                
            } elseif (isset($_GET['type']) && $_GET['type'] === 'bracket' && isset($_GET['id'])) {
                // Update a tax bracket
                $stmt = $db->prepare("
                    UPDATE production_tax_brackets 
                    SET min_amount = ?, max_amount = ?, tax_rate = ?, description = ?
                    WHERE id = ?
                ");
                
                $result = $stmt->execute([
                    $input['min_amount'],
                    $input['max_amount'] ?? null,
                    $input['tax_rate'],
                    $input['description'] ?? null,
                    $_GET['id']
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Tranche fiscale mise à jour avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
                }
            }
            break;
            
        case 'POST':
            // Add new tax bracket
            if (isset($_GET['type']) && $_GET['type'] === 'bracket') {
                $stmt = $db->prepare("
                    INSERT INTO production_tax_brackets 
                    (bracket_order, min_amount, max_amount, tax_rate, description, active) 
                    VALUES (?, ?, ?, ?, ?, 1)
                ");
                
                $result = $stmt->execute([
                    $input['bracket_order'],
                    $input['min_amount'],
                    $input['max_amount'] ?? null,
                    $input['tax_rate'],
                    $input['description'] ?? null
                ]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Tranche fiscale ajoutée avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout']);
                }
            }
            break;
            
        case 'DELETE':
            // Deactivate tax bracket
            if (isset($_GET['type']) && $_GET['type'] === 'bracket' && isset($_GET['id'])) {
                $stmt = $db->prepare("UPDATE production_tax_brackets SET active = 0 WHERE id = ?");
                $result = $stmt->execute([$_GET['id']]);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Tranche fiscale désactivée avec succès']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la désactivation']);
                }
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
