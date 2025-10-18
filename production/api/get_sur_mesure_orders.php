<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            // Get all sur mesure orders with comprehensive data
            $stmt = $db->query("
                SELECT 
                    c.*,
                    c.coupe,
                    is_seen,
                    (SELECT COUNT(*) FROM production_surmesure_images WHERE commande_id = c.id) as images_count,
                    (SELECT COUNT(*) FROM production_surmesure_videos WHERE commande_id = c.id) as videos_count,
                    (SELECT COUNT(*) FROM production_surmesure_commentaires WHERE commande_id = c.id) as comments_count
                FROM production_surmesure_commandes c
                ORDER BY c.created_at DESC
            ");
            
            $orders = $stmt->fetchAll();
            
            // Process each order to add images, videos, and comments
            foreach ($orders as $key => $order) {
                // Get images
                $imagesStmt = $db->prepare("
                    SELECT id, path, commentaire 
                    FROM production_surmesure_images 
                    WHERE commande_id = ?
                    ORDER BY created_at DESC
                ");
                $imagesStmt->execute([$order['id']]);
                $images = $imagesStmt->fetchAll();
                
                // Get videos
                $videosStmt = $db->prepare("
                    SELECT id, path, commentaire 
                    FROM production_surmesure_videos 
                    WHERE commande_id = ?
                    ORDER BY created_at DESC
                ");
                $videosStmt->execute([$order['id']]);
                $videos = $videosStmt->fetchAll();
                
                // Get comments
                $commentsStmt = $db->prepare("
                    SELECT id, commentaire, created_by, date_creation 
                    FROM production_surmesure_commentaires 
                    WHERE commande_id = ?
                    ORDER BY date_creation DESC
                ");
                $commentsStmt->execute([$order['id']]);
                $comments = $commentsStmt->fetchAll();
                
                // Parse measurements, tolerance, and coupe JSON
                $measurements = [];
                $tolerance = [];
                $couple = [];
                $selected_coupe_options = [];
                
                if (!empty($order['measurements'])) {
                    $measurements = json_decode($order['measurements'], true) ?: [];
                }
                
                if (!empty($order['tolerance'])) {
                    $tolerance = json_decode($order['tolerance'], true) ?: [];
                }
                
                // Parse couple field (coupe details) - note: field is named 'couple' in database
                if (!empty($order['couple'])) {
                    $coupleData = json_decode($order['couple'], true) ?: [];
                    // Transform object to array format expected by frontend
                    foreach ($coupleData as $key => $value) {
                        $couple[] = [
                            'donne' => $key,
                            'valeur' => $value
                        ];
                    }
                }
                
                // Parse selected_coupe_options (the field with empty string key or specific field name)
                if (!empty($order['selected_coupe_options'])) {
                    $selected_coupe_options = json_decode($order['selected_coupe_options'], true) ?: [];
                }
                
                // Add processed data to order
                $orders[$key]['measurements'] = $measurements;
                $orders[$key]['tolerance'] = $tolerance;
                $orders[$key]['couple'] = $couple;
                $orders[$key]['selected_coupe_options'] = $selected_coupe_options;
                $orders[$key]['images'] = $images;
                $orders[$key]['videos'] = $videos;
                $orders[$key]['commentaires'] = $comments;
            }
            
            echo json_encode(['success' => true, 'data' => $orders]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error fetching orders: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>