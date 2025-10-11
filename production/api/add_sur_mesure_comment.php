<?php
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
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['order_id']) || !isset($input['commentaire']) || empty(trim($input['commentaire']))) {
        echo json_encode([
            'success' => false,
            'message' => 'ID de commande et commentaire sont requis'
        ]);
        exit;
    }
    
    $orderId = intval($input['order_id']);
    $commentaire = trim($input['commentaire']);
    $createdBy = $input['created_by'] ?? 'Lucci Boutique';
    
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
    
    // Insert comment
    $insertQuery = "INSERT INTO production_surmesure_commentaires (commande_id, commentaire, created_by) VALUES (?, ?, ?)";
    $insertStmt = $pdo->prepare($insertQuery);
    $insertStmt->execute([$orderId, $commentaire, $createdBy]);
    
    $commentId = $pdo->lastInsertId();
    
    // Return the new comment data
    $selectQuery = "SELECT id, commentaire, created_by, date_creation FROM production_surmesure_commentaires WHERE id = ?";
    $selectStmt = $pdo->prepare($selectQuery);
    $selectStmt->execute([$commentId]);
    $newComment = $selectStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Commentaire ajouté avec succès',
        'comment' => $newComment
    ]);

} catch (PDOException $e) {
    error_log("Database error in add_sur_mesure_comment.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("General error in add_sur_mesure_comment.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
}
?>