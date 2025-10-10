<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['product_id'])) {
        throw new Exception('product_id requis');
    }

    $productId = $input['product_id'];
    
    $database = new Database();
    $db = $database->getConnection();

    // Update product status to indicate it's in production and should be removed from products list
    $stmt = $db->prepare("
        UPDATE production_ready_products 
        SET is_in_production = 1, 
            status_product = 'in_production' 
        WHERE id = :product_id
    ");
    $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Produit retiré de la liste des produits en attente'
        ]);
    } else {
        throw new Exception('Erreur lors de la mise à jour du statut du produit');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>