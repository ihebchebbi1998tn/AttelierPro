<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            // Upload employee photo
            if (!isset($_POST['employee_id'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID est obligatoire']);
                break;
            }

            $employeeId = $_POST['employee_id'];

            // Check if employee exists
            $stmt = $db->prepare("SELECT id, photo FROM production_employees WHERE id = ?");
            $stmt->execute([$employeeId]);
            $employee = $stmt->fetch();

            if (!$employee) {
                echo json_encode(['success' => false, 'message' => 'Employé non trouvé']);
                break;
            }

            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                echo json_encode(['success' => false, 'message' => 'Aucune photo fournie ou erreur lors du téléchargement']);
                break;
            }

            $file = $_FILES['photo'];
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            
            if (!in_array($file['type'], $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Format de fichier non supporté. Utilisez JPG, PNG ou WEBP']);
                break;
            }

            // Max 5MB
            if ($file['size'] > 5 * 1024 * 1024) {
                echo json_encode(['success' => false, 'message' => 'La photo ne doit pas dépasser 5MB']);
                break;
            }

            // Create upload directory if not exists
            $uploadDir = '../uploads/employees/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = 'employee_' . $employeeId . '_' . time() . '.' . $extension;
            $filepath = $uploadDir . $filename;

            // Delete old photo if exists
            if (!empty($employee['photo'])) {
                $oldPhotoPath = '../' . $employee['photo'];
                if (file_exists($oldPhotoPath)) {
                    unlink($oldPhotoPath);
                }
            }

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                // Update database
                $relativePath = 'uploads/employees/' . $filename;
                $stmt = $db->prepare("UPDATE production_employees SET photo = ? WHERE id = ?");
                $result = $stmt->execute([$relativePath, $employeeId]);

                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Photo téléchargée avec succès',
                        'photo_url' => 'https://luccibyey.com.tn/production/' . $relativePath
                    ]);
                } else {
                    // Delete uploaded file if DB update fails
                    unlink($filepath);
                    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour de la base de données']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Erreur lors du téléchargement du fichier']);
            }
            break;

        case 'DELETE':
            // Delete employee photo
            if (!isset($_GET['employee_id'])) {
                echo json_encode(['success' => false, 'message' => 'Employee ID est obligatoire']);
                break;
            }

            $employeeId = $_GET['employee_id'];

            // Get employee photo
            $stmt = $db->prepare("SELECT photo FROM production_employees WHERE id = ?");
            $stmt->execute([$employeeId]);
            $employee = $stmt->fetch();

            if (!$employee) {
                echo json_encode(['success' => false, 'message' => 'Employé non trouvé']);
                break;
            }

            if (empty($employee['photo'])) {
                echo json_encode(['success' => false, 'message' => 'Aucune photo à supprimer']);
                break;
            }

            // Delete physical file
            $photoPath = '../' . $employee['photo'];
            if (file_exists($photoPath)) {
                unlink($photoPath);
            }

            // Update database
            $stmt = $db->prepare("UPDATE production_employees SET photo = NULL WHERE id = ?");
            $result = $stmt->execute([$employeeId]);

            if ($result) {
                echo json_encode(['success' => true, 'message' => 'Photo supprimée avec succès']);
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
