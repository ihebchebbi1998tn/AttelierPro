<?php
// Enable error reporting (for debugging, remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set proper headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// Handle both JSON and FormData input for non-GET requests
$input = null;
if ($method !== 'GET') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $input = json_decode($rawInput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            exit;
        }
    }
}

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific supplier
            $stmt = $db->prepare("SELECT * FROM production_materials_fournisseurs WHERE id = ? AND active = 1");
            $stmt->execute([$_GET['id']]);
            $supplier = $stmt->fetch();
            
            if ($supplier) {
                echo json_encode(['success' => true, 'data' => $supplier]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Fournisseur non trouvé']);
            }
        } else {
            // Get all active suppliers
            $stmt = $db->query("
                SELECT f.*, 
                       (SELECT COUNT(*) FROM production_matieres WHERE id_fournisseur = f.id) as materials_count
                FROM production_materials_fournisseurs f 
                WHERE f.active = 1 
                ORDER BY f.name
            ");
            $suppliers = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $suppliers]);
        }
        break;

    case 'POST':
        // Create new supplier
        try {
            // Validate required fields
            if (empty($input['name'])) {
                echo json_encode(['success' => false, 'message' => 'Le nom du fournisseur est obligatoire']);
                break;
            }

            // Check if supplier already exists
            $stmt = $db->prepare("SELECT id FROM production_materials_fournisseurs WHERE name = ? AND active = 1");
            $stmt->execute([$input['name']]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Un fournisseur avec ce nom existe déjà']);
                break;
            }

            $stmt = $db->prepare("
                INSERT INTO production_materials_fournisseurs 
                (name, address, email, phone, created_at, updated_at, active) 
                VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
            ");
            
            $stmt->execute([
                $input['name'],
                $input['address'] ?? null,
                $input['email'] ?? null,
                $input['phone'] ?? null
            ]);
            
            $supplierId = $db->lastInsertId();
            
            // Get the created supplier
            $stmt = $db->prepare("SELECT * FROM production_materials_fournisseurs WHERE id = ?");
            $stmt->execute([$supplierId]);
            $supplier = $stmt->fetch();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Fournisseur créé avec succès',
                'data' => $supplier
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Update supplier
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID du fournisseur requis']);
            break;
        }

        try {
            // Validate required fields
            if (empty($input['name'])) {
                echo json_encode(['success' => false, 'message' => 'Le nom du fournisseur est obligatoire']);
                break;
            }

            // Check if another supplier with the same name exists
            $stmt = $db->prepare("SELECT id FROM production_materials_fournisseurs WHERE name = ? AND id != ? AND active = 1");
            $stmt->execute([$input['name'], $_GET['id']]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Un autre fournisseur avec ce nom existe déjà']);
                break;
            }

            $stmt = $db->prepare("
                UPDATE production_materials_fournisseurs 
                SET name = ?, address = ?, email = ?, phone = ?, updated_at = NOW()
                WHERE id = ? AND active = 1
            ");
            
            $stmt->execute([
                $input['name'],
                $input['address'] ?? null,
                $input['email'] ?? null,
                $input['phone'] ?? null,
                $_GET['id']
            ]);
            
            if ($stmt->rowCount() > 0) {
                // Get the updated supplier
                $stmt = $db->prepare("SELECT * FROM production_materials_fournisseurs WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $supplier = $stmt->fetch();
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Fournisseur mis à jour avec succès',
                    'data' => $supplier
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Fournisseur non trouvé']);
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Soft delete supplier
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID du fournisseur requis']);
            break;
        }

        try {
            // Check if supplier is used by any materials
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM production_matieres WHERE id_fournisseur = ?");
            $stmt->execute([$_GET['id']]);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                echo json_encode([
                    'success' => false, 
                    'message' => 'Ce fournisseur ne peut pas être supprimé car il est utilisé par ' . $result['count'] . ' matériau(x)'
                ]);
                break;
            }

            $stmt = $db->prepare("UPDATE production_materials_fournisseurs SET active = 0, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Fournisseur supprimé avec succès']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Fournisseur non trouvé']);
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
        break;
}
?>