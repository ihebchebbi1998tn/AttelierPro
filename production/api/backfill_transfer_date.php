<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Backfill transfer_date from transferred_at for products that have transferred_at but null transfer_date
    $updateStmt = $db->prepare("
        UPDATE production_ready_products 
        SET transfer_date = DATE(transferred_at)
        WHERE transferred_at IS NOT NULL 
        AND transfer_date IS NULL
    ");
    
    $updateStmt->execute();
    $rowsAffected = $updateStmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully backfilled transfer_date for $rowsAffected products",
        'rows_affected' => $rowsAffected
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>