<?php
require_once 'config.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Get query parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null; // No default limit
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $type = isset($_GET['type']) ? trim($_GET['type']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    $offset = $limit ? ($page - 1) * $limit : 0;

    // Build WHERE clause
    $where_conditions = [];
    $params = [];

    if (!empty($search)) {
        $where_conditions[] = "(nom_product LIKE ? OR reference_product LIKE ? OR description_product LIKE ?)";
        $search_param = "%$search%";
        $params[] = $search_param;
        $params[] = $search_param;
        $params[] = $search_param;
    }

    if (!empty($category)) {
        $where_conditions[] = "category_product = ?";
        $params[] = $category;
    }

    if (!empty($type)) {
        $where_conditions[] = "type_product = ?";
        $params[] = $type;
    }

    if (!empty($status)) {
        $where_conditions[] = "status_product = ?";
        $params[] = $status;
    }

    $where_clause = '';
    if (!empty($where_conditions)) {
        $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
    }

    // Get total count
    $count_sql = "SELECT COUNT(*) as total FROM productions_products_spada $where_clause";
    $count_stmt = $conn->prepare($count_sql);
    $count_stmt->execute($params);
    $total = $count_stmt->fetch()['total'];

    // Get products
    $sql = "SELECT * FROM productions_products_spada $where_clause ORDER BY created_at DESC";
    if ($limit) {
        $sql .= " LIMIT $limit OFFSET $offset";
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $products,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit ?: count($products),
            'total' => (int)$total,
            'total_pages' => $limit ? ceil($total / $limit) : 1
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des produits: ' . $e->getMessage()
    ]);
}
?>