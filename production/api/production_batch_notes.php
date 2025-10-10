<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Get client info for audit
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    switch ($method) {
        case 'GET':
            // Get all notes for a batch
            if (!isset($_GET['batch_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'batch_id parameter is required']);
                exit;
            }
            
            $batch_id = $_GET['batch_id'];
            
            // Verify batch exists
            $batchCheck = $pdo->prepare("SELECT id FROM production_batches WHERE id = ?");
            $batchCheck->execute([$batch_id]);
            if (!$batchCheck->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Batch not found']);
                exit;
            }
            
            // Get notes
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    batch_id,
                    note_text,
                    created_by,
                    created_at,
                    updated_at,
                    DATE_FORMAT(created_at, '%d/%m/%Y %H:%i:%s') as created_at_formatted,
                    DATE_FORMAT(updated_at, '%d/%m/%Y %H:%i:%s') as updated_at_formatted
                FROM production_batch_notes 
                WHERE batch_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$batch_id]);
            $notes = $stmt->fetchAll();
            
            // Add time ago for each note
            foreach ($notes as &$note) {
                $note['created_time_ago'] = timeAgo($note['created_at']);
                $note['updated_time_ago'] = timeAgo($note['updated_at']);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $notes,
                'total' => count($notes)
            ]);
            break;
            
        case 'POST':
            // Create new note
            if (!$input || !isset($input['batch_id']) || !isset($input['note_text'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'batch_id and note_text are required']);
                exit;
            }
            
            $batch_id = $input['batch_id'];
            $note_text = trim($input['note_text']);
            $created_by = $input['created_by'] ?? 'Unknown User';
            
            if (empty($note_text)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Note text cannot be empty']);
                exit;
            }
            
            // Verify batch exists
            $batchCheck = $pdo->prepare("SELECT id FROM production_batches WHERE id = ?");
            $batchCheck->execute([$batch_id]);
            if (!$batchCheck->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Batch not found']);
                exit;
            }
            
            // Insert note
            $stmt = $pdo->prepare("
                INSERT INTO production_batch_notes 
                (batch_id, note_text, created_by, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$batch_id, $note_text, $created_by, $ip_address, $user_agent]);
            
            $note_id = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Note added successfully',
                'note_id' => $note_id
            ]);
            break;
            
        case 'PUT':
            // Update existing note
            if (!$input || !isset($input['note_id']) || !isset($input['note_text'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'note_id and note_text are required']);
                exit;
            }
            
            $note_id = $input['note_id'];
            $note_text = trim($input['note_text']);
            
            if (empty($note_text)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Note text cannot be empty']);
                exit;
            }
            
            // Verify note exists
            $noteCheck = $pdo->prepare("SELECT id FROM production_batch_notes WHERE id = ?");
            $noteCheck->execute([$note_id]);
            if (!$noteCheck->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Note not found']);
                exit;
            }
            
            // Update note
            $stmt = $pdo->prepare("
                UPDATE production_batch_notes 
                SET note_text = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $stmt->execute([$note_text, $note_id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Note updated successfully'
            ]);
            break;
            
        case 'DELETE':
            // Delete note
            if (!$input || !isset($input['note_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'note_id is required']);
                exit;
            }
            
            $note_id = $input['note_id'];
            
            // Verify note exists
            $noteCheck = $pdo->prepare("SELECT id FROM production_batch_notes WHERE id = ?");
            $noteCheck->execute([$note_id]);
            if (!$noteCheck->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Note not found']);
                exit;
            }
            
            // Delete note
            $stmt = $pdo->prepare("DELETE FROM production_batch_notes WHERE id = ?");
            $stmt->execute([$note_id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Note deleted successfully'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Error in production_batch_notes.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error: ' . $e->getMessage()
    ]);
}

function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) return 'à l\'instant';
    if ($time < 3600) return floor($time/60) . ' minute' . (floor($time/60) > 1 ? 's' : '');
    if ($time < 86400) return floor($time/3600) . ' heure' . (floor($time/3600) > 1 ? 's' : '');
    if ($time < 2592000) return floor($time/86400) . ' jour' . (floor($time/86400) > 1 ? 's' : '');
    if ($time < 31536000) return floor($time/2592000) . ' mois';
    return floor($time/31536000) . ' année' . (floor($time/31536000) > 1 ? 's' : '');
}
?>