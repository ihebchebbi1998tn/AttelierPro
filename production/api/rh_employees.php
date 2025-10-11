<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single employee
                $stmt = $db->prepare("SELECT * FROM production_employees WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $employee = $stmt->fetch();
                
                if ($employee) {
                    echo json_encode(['success' => true, 'data' => $employee]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Employé non trouvé']);
                }
            } else {
                // Get all employees with filters
                $where = [];
                $params = [];
                
                if (isset($_GET['region']) && $_GET['region'] !== 'all') {
                    $where[] = "region = ?";
                    $params[] = $_GET['region'];
                }
                
                if (isset($_GET['status']) && $_GET['status'] !== 'all') {
                    if ($_GET['status'] === 'actif') {
                        $where[] = "actif = 1";
                    } elseif ($_GET['status'] === 'inactif') {
                        $where[] = "actif = 0";
                    }
                }
                
                if (isset($_GET['search']) && !empty($_GET['search'])) {
                    $where[] = "(nom LIKE ? OR prenom LIKE ?)";
                    $search = '%' . $_GET['search'] . '%';
                    $params[] = $search;
                    $params[] = $search;
                }
                
                $whereClause = empty($where) ? '' : 'WHERE ' . implode(' AND ', $where);
                $sql = "SELECT * FROM production_employees $whereClause ORDER BY nom, prenom";
                
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $employees = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'data' => $employees]);
            }
            break;
            
        case 'POST':
            // Create new employee
            if (empty($input['nom']) || empty($input['prenom'])) {
                echo json_encode(['success' => false, 'message' => 'Nom et prénom sont obligatoires']);
                break;
            }
            
            $chefDeFamille = isset($input['chef_de_famille']) && $input['chef_de_famille'] && 
                             isset($input['sexe']) && $input['sexe'] === 'homme' ? 1 : 0;
            
            $stmt = $db->prepare("
                INSERT INTO production_employees (nom, prenom, telephone, adresse, region, statut_civil, actif, role, age, carte_identite, sexe, cnss_code, nombre_enfants, date_naissance, chef_de_famille) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['nom'],
                $input['prenom'],
                $input['telephone'] ?? null,
                $input['adresse'] ?? null,
                $input['region'] ?? null,
                $input['statut_civil'] ?? 'autre',
                $input['actif'] ?? 1,
                $input['role'] ?? null,
                $input['age'] ?? null,
                $input['carte_identite'] ?? null,
                $input['sexe'] ?? null,
                $input['cnss_code'] ?? null,
                $input['nombre_enfants'] ?? 0,
                $input['date_naissance'] ?? null,
                $chefDeFamille
            ]);
            
            if ($result) {
                $employeeId = $db->lastInsertId();
                echo json_encode(['success' => true, 'message' => 'Employé créé avec succès', 'id' => $employeeId]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
            }
            break;
            
        case 'PUT':
            // Update employee
            if (!isset($_GET['id']) || empty($input['nom']) || empty($input['prenom'])) {
                echo json_encode(['success' => false, 'message' => 'ID, nom et prénom sont obligatoires']);
                break;
            }
            
            $chefDeFamille = isset($input['chef_de_famille']) && $input['chef_de_famille'] && 
                             isset($input['sexe']) && $input['sexe'] === 'homme' ? 1 : 0;
            
            $stmt = $db->prepare("
                UPDATE production_employees 
                SET nom = ?, prenom = ?, telephone = ?, adresse = ?, region = ?, statut_civil = ?, actif = ?, role = ?, age = ?, carte_identite = ?, sexe = ?, cnss_code = ?, nombre_enfants = ?, date_naissance = ?, chef_de_famille = ?
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $input['nom'],
                $input['prenom'],
                $input['telephone'] ?? null,
                $input['adresse'] ?? null,
                $input['region'] ?? null,
                $input['statut_civil'] ?? 'autre',
                $input['actif'] ?? 1,
                $input['role'] ?? null,
                $input['age'] ?? null,
                $input['carte_identite'] ?? null,
                $input['sexe'] ?? null,
                $input['cnss_code'] ?? null,
                $input['nombre_enfants'] ?? 0,
                $input['date_naissance'] ?? null,
                $chefDeFamille,
                $_GET['id']
            ]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Employé mis à jour avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
            }
            break;
            
        case 'DELETE':
            // Delete employee
            if (!isset($_GET['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID obligatoire']);
                break;
            }
            
            $stmt = $db->prepare("DELETE FROM production_employees WHERE id = ?");
            $result = $stmt->execute([$_GET['id']]);
            
            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Employé supprimé avec succès']);
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