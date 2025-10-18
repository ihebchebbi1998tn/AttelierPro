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
        if (!$batch_id) {
            http_response_code(400);
            echo json_encode(['error' => 'batch_id is required']);
            exit;
        }
        
        if (!$materials_quantities || !is_array($materials_quantities)) {
            http_response_code(400);
            echo json_encode(['error' => 'materials_quantities must be a valid array']);
            exit;
        }
        
        // Check if batch exists
        $checkStmt = $pdo->prepare("SELECT id, status FROM production_batches WHERE id = ?");
        $checkStmt->execute([$batch_id]);
        $batch = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$batch) {
            http_response_code(404);
            echo json_encode(['error' => 'Batch not found']);
            exit;
        }
        
        // Allow updates only if batch is not yet in production (status is 'planifie')
        // This prevents accidental changes after stock has been deducted
        if ($batch['status'] === 'en_cours' || $batch['status'] === 'termine') {
            http_response_code(400);
            echo json_encode([
                'error' => 'Cannot update material quantities for batches in production or completed',
                'current_status' => $batch['status']
            ]);
            exit;
        }
        
        error_log("Updating materials quantities for batch {$batch_id}: " . json_encode($materials_quantities));
        
        // Update batch with materials quantities
        $updateStmt = $pdo->prepare("
            UPDATE production_batches 
            SET materials_quantities = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $updateStmt->execute([json_encode($materials_quantities), $batch_id]);
        
        error_log("Successfully updated materials quantities for batch {$batch_id}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Materials quantities updated successfully',
            'batch_id' => $batch_id,
            'rows_affected' => $updateStmt->rowCount()
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
