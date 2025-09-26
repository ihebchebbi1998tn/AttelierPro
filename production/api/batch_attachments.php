<?php
require_once 'config.php';

// Enable error logging for debugging
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['batch_id'])) {
            // Get all attachments for a specific batch
            $stmt = $db->prepare("
                SELECT id, batch_id, filename, original_filename, file_path, file_type, 
                       file_size, mime_type, description, uploaded_by, created_date, modified_date
                FROM production_batch_attachments 
                WHERE batch_id = ?
                ORDER BY created_date DESC
            ");
            $stmt->execute([$_GET['batch_id']]);
            $attachments = $stmt->fetchAll();
            
            // Add full URLs for attachments
            foreach($attachments as &$attachment) {
                $attachment['full_url'] = 'https://luccibyey.com.tn/production/api/' . $attachment['file_path'];
            }
            
            echo json_encode(['success' => true, 'data' => $attachments]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Batch ID required']);
        }
        break;

    case 'POST':
        // Handle file upload for batch
        if (!isset($_FILES['file']) || !isset($_POST['batch_id'])) {
            echo json_encode(['success' => false, 'message' => 'File and batch ID are required']);
            exit;
        }

        $batch_id = $_POST['batch_id'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $uploaded_by = isset($_POST['uploaded_by']) ? $_POST['uploaded_by'] : 'system';
        
        $file = $_FILES['file'];
        $upload_dir = 'uploads/batch_attachments/';
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size must be less than 10MB']);
            exit;
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'batch_' . $batch_id . '_' . uniqid() . '_' . time() . '.' . $file_extension;
        $file_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $file_path)) {
            try {
                // Create table if it doesn't exist
                $db->exec("CREATE TABLE IF NOT EXISTS production_batch_attachments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    batch_id INT NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    file_type VARCHAR(100),
                    file_size INT,
                    mime_type VARCHAR(100),
                    description TEXT,
                    uploaded_by VARCHAR(100),
                    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_batch_id (batch_id)
                )");
                
                // Save to database
                $stmt = $db->prepare("
                    INSERT INTO production_batch_attachments 
                    (batch_id, filename, original_filename, file_path, file_type, file_size, mime_type, description, uploaded_by, created_date, modified_date) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                $result = $stmt->execute([
                    $batch_id,
                    $filename,
                    $file['name'],
                    $file_path,
                    $file_extension,
                    $file['size'],
                    $file['type'],
                    $description,
                    $uploaded_by
                ]);
                
                if($result) {
                    $attachment_id = $db->lastInsertId();
                    echo json_encode([
                        'success' => true, 
                        'message' => 'File uploaded successfully',
                        'attachment_id' => $attachment_id,
                        'file_path' => $file_path,
                        'full_url' => 'https://luccibyey.com.tn/production/api/' . $file_path
                    ]);
                } else {
                    // Delete uploaded file if database insert failed
                    unlink($file_path);
                    $errorInfo = $stmt->errorInfo();
                    echo json_encode(['success' => false, 'message' => 'Database error: ' . $errorInfo[2]]);
                }
            } catch (Exception $e) {
                // Delete uploaded file if any error occurred
                unlink($file_path);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Error uploading file: ' . error_get_last()['message']]);
        }
        break;

    case 'DELETE':
        // Delete batch attachment
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            echo json_encode(['success' => false, 'message' => 'Attachment ID required']);
            exit;
        }
        
        // Get file path before deleting from database
        $stmt = $db->prepare("SELECT file_path FROM production_batch_attachments WHERE id = ?");
        $stmt->execute([$input['id']]);
        $attachment = $stmt->fetch();
        
        if ($attachment) {
            // Delete from database
            $stmt = $db->prepare("DELETE FROM production_batch_attachments WHERE id = ?");
            $result = $stmt->execute([$input['id']]);
            
            if ($result) {
                // Delete physical file
                if (file_exists($attachment['file_path'])) {
                    unlink($attachment['file_path']);
                }
                echo json_encode(['success' => true, 'message' => 'Attachment deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error deleting attachment']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>