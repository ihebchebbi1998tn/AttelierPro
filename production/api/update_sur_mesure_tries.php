<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]);
    exit;
}

try {
    // Create database connection using the Database class
    $database = new Database();
    $pdo = $database->getConnection();
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['id']) || !isset($input['number_of_tries'])) {
        echo json_encode([
            'success' => false,
            'message' => 'ID et nombre d\'essais sont requis'
        ]);
        exit;
    }
    
    $orderId = intval($input['id']);
    $numberOfTries = intval($input['number_of_tries']);
    
    // Validate number of tries (should be 1, 2, or 3)
    if ($numberOfTries < 1 || $numberOfTries > 3) {
        echo json_encode([
            'success' => false,
            'message' => 'Nombre d\'essais invalide (doit être 1, 2 ou 3)'
        ]);
        exit;
    }
    
    // Check if order exists
    $checkQuery = "SELECT id, first_try_date, second_try_date, third_try_date FROM production_surmesure_commandes WHERE id = ?";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$orderId]);
    $order = $checkStmt->fetch();
    
    if (!$order) {
        echo json_encode([
            'success' => false,
            'message' => 'Commande non trouvée'
        ]);
        exit;
    }
    
    // Update the appropriate try date to current date
    $updateField = '';
    $newStatus = '';
    
    switch ($numberOfTries) {
        case 1:
            $updateField = 'first_try_date';
            $newStatus = 'first_try';
            break;
        case 2:
            $updateField = 'second_try_date';
            $newStatus = 'ready_for_second_try';
            break;
        case 3:
            $updateField = 'third_try_date';
            $newStatus = 'completed';
            break;
    }
    
    // Update the try date and status
    $updateQuery = "UPDATE production_surmesure_commandes SET {$updateField} = CURRENT_DATE, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    $updateStmt = $pdo->prepare($updateQuery);
    $success = $updateStmt->execute([$newStatus, $orderId]);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => "Essai #{$numberOfTries} enregistré avec succès"
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erreur lors de la mise à jour de l\'essai'
        ]);
    }

} catch (PDOException $e) {
    error_log("Database error in update_sur_mesure_tries.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General error in update_sur_mesure_tries.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
}
?>