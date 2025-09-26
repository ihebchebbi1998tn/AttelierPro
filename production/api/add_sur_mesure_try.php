<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$order_id = $input['order_id'] ?? null;
$scheduled_date = $input['scheduled_date'] ?? null;
$scheduled_time = $input['scheduled_time'] ?? null;

if (!$order_id || !$scheduled_date) {
    http_response_code(400);
    echo json_encode(['error' => 'Order ID and scheduled date are required']);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // First check if the table exists
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'surmesure_tries'");
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database table not created. Please run the SQL migration first.'
        ]);
        exit;
    }
    
    // Get the next try number for this order
    $stmt = $pdo->prepare("
        SELECT COALESCE(MAX(try_number), 0) + 1 as next_try_number 
        FROM surmesure_tries 
        WHERE order_id = :order_id
    ");
    $stmt->bindParam(':order_id', $order_id, PDO::PARAM_INT);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $try_number = $result['next_try_number'];
    
    // Insert new try
    $stmt = $pdo->prepare("
        INSERT INTO surmesure_tries (order_id, try_number, scheduled_date, scheduled_time) 
        VALUES (:order_id, :try_number, :scheduled_date, :scheduled_time)
    ");
    
    $stmt->bindParam(':order_id', $order_id, PDO::PARAM_INT);
    $stmt->bindParam(':try_number', $try_number, PDO::PARAM_INT);
    $stmt->bindParam(':scheduled_date', $scheduled_date);
    $stmt->bindParam(':scheduled_time', $scheduled_time);
    
    $stmt->execute();
    
    $try_id = $pdo->lastInsertId();
    
    // Return the created try
    $stmt = $pdo->prepare("
        SELECT * FROM surmesure_tries 
        WHERE id = :try_id
    ");
    $stmt->bindParam(':try_id', $try_id, PDO::PARAM_INT);
    $stmt->execute();
    $new_try = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'try' => $new_try,
        'message' => 'Try added successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in add_sur_mesure_try.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("General error in add_sur_mesure_try.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error occurred'
    ]);
}
?>