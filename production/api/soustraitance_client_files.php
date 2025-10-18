<?php
include_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $client_id = isset($_GET['client_id']) ? $_GET['client_id'] : null;
        
        if (!$client_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Client ID is required'
            ]);
            exit;
        }

        // Get files for the client
        $query = "SELECT `file_id`, `client_id`, `file_path`, `original_filename`, `filename`, 
                        `file_type`, `file_size`, `mime_type`, `uploaded_user`, `upload_date`, 
                        `description`, `created_at`, `updated_at` 
                 FROM `production_soustraitance_clients_files` 
                 WHERE `client_id` = :client_id 
                 ORDER BY `upload_date` DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':client_id', $client_id);
        $stmt->execute();
        $files = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $files
        ]);

    } elseif ($method === 'POST') {
        $client_id = isset($_POST['client_id']) ? $_POST['client_id'] : null;
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        $uploaded_user = isset($_POST['uploaded_user']) ? trim($_POST['uploaded_user']) : 'System';
        
        if (!$client_id) {
            echo json_encode([
                'success' => false,
                'message' => 'Client ID is required'
            ]);
            exit;
        }

        // Validate client exists
        $clientCheck = "SELECT id FROM production_soustraitance_clients WHERE id = :client_id";
        $clientStmt = $db->prepare($clientCheck);
        $clientStmt->bindParam(':client_id', $client_id);
        $clientStmt->execute();
        
        if ($clientStmt->rowCount() === 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Client not found'
            ]);
            exit;
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode([
                'success' => false,
                'message' => 'No file uploaded or upload error occurred'
            ]);
            exit;
        }

        $file = $_FILES['file'];
        $originalFilename = $file['name'];
        $fileSize = $file['size'];
        $mimeType = $file['type'];
        $tmpName = $file['tmp_name'];

        // Validate file size (max 20MB)
        $maxFileSize = 20 * 1024 * 1024; // 20MB
        if ($fileSize > $maxFileSize) {
            echo json_encode([
                'success' => false,
                'message' => 'File size must be less than 20MB'
            ]);
            exit;
        }

        // Validate file type
        $allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];

        if (!in_array($mimeType, $allowedTypes)) {
            echo json_encode([
                'success' => false,
                'message' => 'File type not allowed. Allowed types: PDF, Images (JPEG, PNG, GIF, WebP), Word, Excel, Text, CSV'
            ]);
            exit;
        }

        // Generate unique filename
        $fileExtension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $uniqueFilename = 'client_' . $client_id . '_' . uniqid() . '.' . $fileExtension;
        
        // Create upload directory if it doesn't exist
        $uploadDir = '../uploads/client_files/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filePath = $uploadDir . $uniqueFilename;

        // Move uploaded file
        if (!move_uploaded_file($tmpName, $filePath)) {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save file'
            ]);
            exit;
        }

        // Save file info to database
        $query = "INSERT INTO `production_soustraitance_clients_files` 
                  (`client_id`, `file_path`, `original_filename`, `filename`, `file_type`, 
                   `file_size`, `mime_type`, `uploaded_user`, `description`) 
                  VALUES (:client_id, :file_path, :original_filename, :filename, :file_type, 
                          :file_size, :mime_type, :uploaded_user, :description)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':client_id', $client_id);
        $stmt->bindParam(':file_path', $filePath);
        $stmt->bindParam(':original_filename', $originalFilename);
        $stmt->bindParam(':filename', $uniqueFilename);
        $stmt->bindParam(':file_type', $fileExtension);
        $stmt->bindParam(':file_size', $fileSize);
        $stmt->bindParam(':mime_type', $mimeType);
        $stmt->bindParam(':uploaded_user', $uploaded_user);
        $stmt->bindParam(':description', $description);

        if ($stmt->execute()) {
            $fileId = $db->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => [
                    'file_id' => $fileId,
                    'filename' => $uniqueFilename,
                    'original_filename' => $originalFilename
                ]
            ]);
        } else {
            // Delete the file if database insert failed
            unlink($filePath);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save file information'
            ]);
        }

    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $file_id = isset($input['file_id']) ? $input['file_id'] : null;
        
        if (!$file_id) {
            echo json_encode([
                'success' => false,
                'message' => 'File ID is required'
            ]);
            exit;
        }

        // Get file info before deletion
        $query = "SELECT file_path FROM production_soustraitance_clients_files WHERE file_id = :file_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':file_id', $file_id);
        $stmt->execute();
        $file = $stmt->fetch();

        if (!$file) {
            echo json_encode([
                'success' => false,
                'message' => 'File not found'
            ]);
            exit;
        }

        // Delete from database
        $deleteQuery = "DELETE FROM production_soustraitance_clients_files WHERE file_id = :file_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':file_id', $file_id);

        if ($deleteStmt->execute()) {
            // Delete physical file
            if (file_exists($file['file_path'])) {
                unlink($file['file_path']);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'File deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete file'
            ]);
        }

    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>