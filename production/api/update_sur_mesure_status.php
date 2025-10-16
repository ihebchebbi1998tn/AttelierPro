<?php
ob_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input) || empty($input)) {
        // Fallback to form data
        $input = $_POST;
    }
    
    // Validate required fields
    if (!isset($input['id']) || !isset($input['status'])) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'ID et statut sont requis'
        ]);
        exit;
    }
    
    $orderId = intval($input['id']);
    $newStatus = $input['status'];
    
    // Validate status value
    $validStatuses = ['new', 'in_progress', 'ready_for_pickup', 'first_try', 'needs_revision', 'ready_for_second_try', 'completed'];
    if (!in_array($newStatus, $validStatuses)) {
        echo json_encode([
            'success' => false,
            'message' => 'Statut invalide'
        ]);
        exit;
    }
    
    // Check if order exists
    $checkQuery = "SELECT id FROM production_surmesure_commandes WHERE id = ?";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$orderId]);
    
    if (!$checkStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Commande non trouvée'
        ]);
        exit;
    }
    
    // Update status
    $updateQuery = "UPDATE production_surmesure_commandes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->execute([$newStatus, $orderId]);
    
    // Add automatic comment about status change
    $statusLabels = [
        'new' => 'Nouveau',
        'in_progress' => 'En cours',
        'ready_for_pickup' => 'Prêt pour essai',
        'first_try' => 'Premier essai',
        'needs_revision' => 'Révision nécessaire',
        'ready_for_second_try' => 'Prêt 2ème essai',
        'completed' => 'Terminé'
    ];
    
    $commentText = "Statut changé en: " . ($statusLabels[$newStatus] ?? $newStatus);
    if (isset($input['comment']) && !empty($input['comment'])) {
        $commentText .= " - " . $input['comment'];
    }
    
    $commentQuery = "INSERT INTO production_surmesure_commentaires (commande_id, commentaire, created_by) VALUES (?, ?, 'admin')";
    $commentStmt = $pdo->prepare($commentQuery);
    $commentStmt->execute([$orderId, $commentText]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Statut mis à jour avec succès'
    ]);

} catch (PDOException $e) {
    error_log("Database error in update_sur_mesure_status.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General error in update_sur_mesure_status.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
}
ob_end_flush();