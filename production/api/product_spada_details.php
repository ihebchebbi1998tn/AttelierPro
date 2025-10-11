<?php
require_once 'config.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Get product ID from URL parameter
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'ID de produit invalide'
        ]);
        exit;
    }

    // Get product details
    $sql = "SELECT * FROM productions_products_spada WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        echo json_encode([
            'success' => false,
            'message' => 'Produit non trouvé'
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data' => $product
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération du produit: ' . $e->getMessage()
    ]);
}
?>