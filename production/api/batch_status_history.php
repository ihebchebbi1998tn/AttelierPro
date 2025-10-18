<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $batch_id = $_GET['batch_id'] ?? null;
        
        if (!$batch_id) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id parameter is required']);
            exit;
        }
        
        // Validate batch exists
        $batchStmt = $pdo->prepare("SELECT id FROM production_batches WHERE id = ?");
        $batchStmt->execute([$batch_id]);
        
        if (!$batchStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Batch not found']);
            exit;
        }
        
        // Get status history for the batch
        $stmt = $pdo->prepare("
            SELECT 
                id,
                batch_id,
                old_status,
                new_status,
                changed_by,
                changed_at,
                comments,
                ip_address
            FROM batch_status_history 
            WHERE batch_id = ? 
            ORDER BY changed_at DESC, id DESC
        ");
        
        $stmt->execute([$batch_id]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format dates for frontend
        foreach ($history as &$entry) {
            $entry['changed_at_formatted'] = date('d/m/Y H:i:s', strtotime($entry['changed_at']));
            $entry['time_ago'] = timeAgo($entry['changed_at']);
        }
        
        echo json_encode([
            'success' => true,
            'data' => $history,
            'total' => count($history)
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    error_log("Database error in batch_status_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in batch_status_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}

function timeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->y > 0) return $diff->y . ' an' . ($diff->y > 1 ? 's' : '');
    if ($diff->m > 0) return $diff->m . ' mois';
    if ($diff->d > 0) return $diff->d . ' jour' . ($diff->d > 1 ? 's' : '');
    if ($diff->h > 0) return $diff->h . ' heure' . ($diff->h > 1 ? 's' : '');
    if ($diff->i > 0) return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '');
    return 'À l\'instant';
}
?>