<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $batch_id = $input['batch_id'] ?? null;
        $materials_quantities = $input['materials_quantities'] ?? null;
        
        // Validation
        if (!$batch_id || !$materials_quantities) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id and materials_quantities are required']);
            exit;
        }
        
        // Update batch with materials quantities
        $updateStmt = $pdo->prepare("
            UPDATE production_batches 
            SET materials_quantities = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $updateStmt->execute([json_encode($materials_quantities), $batch_id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Materials quantities updated successfully'
        ]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    error_log("Database error in update_batch_materials_quantities.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred']);
} catch (Exception $e) {
    error_log("General error in update_batch_materials_quantities.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>
