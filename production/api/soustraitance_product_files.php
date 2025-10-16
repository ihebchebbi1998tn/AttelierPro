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
        if(isset($_GET['product_id'])) {
            // Get all files for a specific soustraitance product
            $stmt = $db->prepare("
                SELECT file_id, product_id, filename, original_filename, file_path, file_type, 
                       file_size, mime_type, description, uploaded_user, upload_date
                FROM production_soustraitance_products_files 
                WHERE product_id = ?
                ORDER BY upload_date DESC
            ");
            $stmt->execute([$_GET['product_id']]);
            $files = $stmt->fetchAll();
            
            // Add full URLs for files
            foreach($files as &$file) {
                $file['full_url'] = 'https://luccibyey.com.tn/production/api/' . $file['file_path'];
            }
            
            echo json_encode(['success' => true, 'data' => $files]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Product ID required']);
        }
        break;

    case 'POST':
        // Handle file upload for soustraitance product
        if (!isset($_FILES['file']) || !isset($_POST['product_id'])) {
            echo json_encode(['success' => false, 'message' => 'File and product ID are required']);
            exit;
        }

        $product_id = $_POST['product_id'];
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $uploaded_user = isset($_POST['uploaded_user']) ? $_POST['uploaded_user'] : 'system';
        
        $file = $_FILES['file'];
        $upload_dir = 'uploads/soustraitance_product_files/';
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Validate file type (PNG, JPG, PDF only)
        $allowed_types = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!in_array($file['type'], $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'Seuls les fichiers PNG, JPG et PDF sont autorisés']);
            exit;
        }
        
        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size must be less than 10MB']);
            exit;
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'soustraitance_product_' . $product_id . '_' . uniqid() . '_' . time() . '.' . $file_extension;
        $file_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $file_path)) {
            try {
                // Create table if it doesn't exist
                $db->exec("CREATE TABLE IF NOT EXISTS production_soustraitance_products_files (
                    file_id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    file_type VARCHAR(100),
                    file_size INT,
                    mime_type VARCHAR(100),
                    uploaded_user VARCHAR(100),
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    description TEXT,
                    INDEX idx_product_id (product_id)
                )");
                
                // Save to database
                $stmt = $db->prepare("
                    INSERT INTO production_soustraitance_products_files 
                    (product_id, filename, original_filename, file_path, file_type, file_size, mime_type, description, uploaded_user, upload_date) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                
                $result = $stmt->execute([
                    $product_id,
                    $filename,
                    $file['name'],
                    $file_path,
                    $file_extension,
                    $file['size'],
                    $file['type'],
                    $description,
                    $uploaded_user
                ]);
                
                if($result) {
                    $file_id = $db->lastInsertId();
                    echo json_encode([
                        'success' => true, 
                        'message' => 'File uploaded successfully',
                        'file_id' => $file_id,
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
        // Delete soustraitance product file
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['file_id'])) {
            echo json_encode(['success' => false, 'message' => 'File ID required']);
            exit;
        }
        
        // Get file path before deleting from database
        $stmt = $db->prepare("SELECT file_path FROM production_soustraitance_products_files WHERE file_id = ?");
        $stmt->execute([$input['file_id']]);
        $file_record = $stmt->fetch();
        
        if ($file_record) {
            // Delete from database
            $stmt = $db->prepare("DELETE FROM production_soustraitance_products_files WHERE file_id = ?");
            $result = $stmt->execute([$input['file_id']]);
            
            if ($result) {
                // Delete physical file
                if (file_exists($file_record['file_path'])) {
                    unlink($file_record['file_path']);
                }
                echo json_encode(['success' => true, 'message' => 'File deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error deleting file']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'File not found']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>