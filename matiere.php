<?php
// Enable error reporting (for debugging, remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Increase memory and execution limits for large responses
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 60);

// Set proper headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// Handle both JSON and FormData input for non-GET requests
$input = null;
$isFormData = false;

// Only parse input for methods that have a request body
if ($method !== 'GET') {
    if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
        // FormData input (with file uploads)
        $input = $_POST;
        $isFormData = true;
    } else {
        // JSON input
        $rawInput = file_get_contents('php://input');
        if (!empty($rawInput)) {
            $input = json_decode($rawInput, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
                exit;
            }
        }
    }
}

// Helper function to calculate stock status
function calculateStockStatus($quantity_total, $lowest_quantity_needed, $medium_quantity_needed, $good_quantity_needed) {
    if ($quantity_total <= $lowest_quantity_needed) {
        return 'critical';
    } elseif ($quantity_total <= $medium_quantity_needed) {
        return 'warning';
    } elseif ($quantity_total >= $good_quantity_needed) {
        return 'good';
    } else {
        return 'warning'; // Between medium and good
    }
}

// Helper function to calculate progress percentage
function calculateProgressPercentage($quantity_total, $good_quantity_needed) {
    if ($good_quantity_needed <= 0) return 0;
    return min(($quantity_total / $good_quantity_needed) * 100, 100);
}

// Helper function to build ORDER BY clause with natural sorting for numeric names
function buildOrderByClause($sort_by = 'created_at', $sort_order = 'DESC') {
    $sort_order = strtoupper($sort_order) === 'ASC' ? 'ASC' : 'DESC';
    
    switch ($sort_by) {
        case 'name':
            // Natural sorting for numeric names like 1, 2, 3, 4, 5
            return "ORDER BY CAST(m.nom AS UNSIGNED) " . $sort_order . ", m.nom " . $sort_order;
        case 'category':
            return "ORDER BY c.nom " . $sort_order;
        case 'stock':
            return "ORDER BY m.quantite_stock " . $sort_order;
        case 'price':
            return "ORDER BY m.prix_unitaire " . $sort_order;
        case 'location':
            return "ORDER BY m.location " . $sort_order;
        default:
            return "ORDER BY m.created_at " . $sort_order;
    }
}

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            // Get specific material with enhanced data including customer info
            $stmt = $db->prepare("
                SELECT m.*, c.nom as category_name, f.name as fournisseur_name, sc.name as customer_name,
                        (SELECT COUNT(*) FROM production_transactions_stock WHERE material_id = m.id AND type_mouvement = 'in') as total_entries,
                       (SELECT COUNT(*) FROM production_transactions_stock WHERE material_id = m.id AND type_mouvement = 'out') as total_exits,
                       (SELECT MAX(date_transaction) FROM production_transactions_stock WHERE material_id = m.id AND type_mouvement = 'in') as last_entry_date,
                       (SELECT MAX(date_transaction) FROM production_transactions_stock WHERE material_id = m.id AND type_mouvement = 'out') as last_exit_date
                FROM production_matieres m 
                LEFT JOIN production_matieres_category c ON m.category_id = c.id
                LEFT JOIN production_materials_fournisseurs f ON m.id_fournisseur = f.id AND f.active = 1
                LEFT JOIN production_soustraitance_clients sc ON m.extern_customer_id = sc.id
                WHERE m.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $material = $stmt->fetch();
            
            if ($material) {
                // Get material images
                $imageStmt = $db->prepare("
                    SELECT image_id, file_path, upload_date 
                    FROM production_images 
                    WHERE related_type = 'matiere' AND related_id = ?
                    ORDER BY upload_date ASC
                ");
                $imageStmt->execute([$_GET['id']]);
                $images = $imageStmt->fetchAll();
                
                // Map database fields to expected frontend fields
                $material['material_id'] = $material['id'];
                $material['title'] = $material['nom'];
                $material['quantity_total'] = $material['quantite_stock'];
                $material['lowest_quantity_needed'] = $material['quantite_min'];
                $material['medium_quantity_needed'] = $material['quantite_min']; // Using min as medium for now
                $material['good_quantity_needed'] = $material['quantite_max'];
                $material['quantity_type'] = 'unit'; // Default value
                $material['color'] = $material['couleur'];
                $material['price'] = $material['prix_unitaire'];
                $material['images'] = $images; // Add images array
                
                $material['status'] = calculateStockStatus(
                    $material['quantite_stock'], 
                    $material['quantite_min'], 
                    $material['quantite_min'],
                    $material['quantite_max']
                );
                $material['progress_percentage'] = calculateProgressPercentage($material['quantite_stock'], $material['quantite_max']);
            }
            
            echo json_encode(['success' => true, 'data' => $material]);
            
        } elseif(isset($_GET['stock_levels'])) {
            // Get all materials with stock level calculations, categories and customer info
            // Handle sorting parameters
            $sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
            $sort_order = isset($_GET['order']) ? $_GET['order'] : 'DESC';
            
            // Build ORDER BY clause
            $order_clause = buildOrderByClause($sort_by, $sort_order);
            
            $stmt = $db->query("
                SELECT m.*, c.nom as category_name, f.name as fournisseur_name, sc.name as customer_name,
                       (SELECT MAX(date_transaction) FROM production_transactions_stock WHERE material_id = m.id AND type_mouvement = 'in') as last_entry_date,
                       (SELECT MAX(date_transaction) FROM production_transactions_stock WHERE material_id = m.id AND type_mouvement = 'out') as last_exit_date,
                       (SELECT file_path FROM production_images WHERE related_type = 'matiere' AND related_id = m.id ORDER BY upload_date ASC LIMIT 1) as first_image_path
                FROM production_matieres m 
                LEFT JOIN production_matieres_category c ON m.category_id = c.id
                LEFT JOIN production_materials_fournisseurs f ON m.id_fournisseur = f.id AND f.active = 1
                LEFT JOIN production_soustraitance_clients sc ON m.extern_customer_id = sc.id
                WHERE m.active = 1
                " . $order_clause . "
            ");
            $materials = $stmt->fetchAll();
            
            foreach ($materials as &$material) {
                // Map database fields to expected frontend fields
                $material['material_id'] = $material['id'];
                $material['title'] = $material['nom'];
                $material['quantity_total'] = $material['quantite_stock'];
                $material['lowest_quantity_needed'] = $material['quantite_min'];
                $material['medium_quantity_needed'] = $material['quantite_min'];
                $material['good_quantity_needed'] = $material['quantite_max'];
                $material['quantity_type'] = 'unit';
                $material['color'] = $material['couleur'];
                $material['price'] = $material['prix_unitaire'];
                
                $material['status'] = calculateStockStatus(
                    $material['quantite_stock'], 
                    $material['quantite_min'], 
                    $material['quantite_min'],
                    $material['quantite_max']
                );
                $material['progress_percentage'] = calculateProgressPercentage($material['quantite_stock'], $material['quantite_max']);
                
                // Set proper image URL or placeholder
                if (!empty($material['first_image_path'])) {
                    $material['image_url'] = "https://luccibyey.com.tn/production/" . $material['first_image_path'];
                } else {
                    $material['image_url'] = "https://via.placeholder.com/64x64/64748b/ffffff?text=" . substr($material['nom'], 0, 3);
                }
            }
            
            echo json_encode(['success' => true, 'data' => $materials]);
            
        } elseif(isset($_GET['replaceable'])) {
            // Get replaceable materials with sorting
            $sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'nom';
            $sort_order = isset($_GET['order']) ? $_GET['order'] : 'ASC';
            $order_clause = buildOrderByClause($sort_by, $sort_order);
            
            $stmt = $db->query("SELECT * FROM production_matieres WHERE active = 1 " . str_replace('m.', '', $order_clause));
            $materials = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $materials]);
            
        } elseif(isset($_GET['low_stock'])) {
            // Get materials with low stock (critical + warning) with sorting
            $sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'stock';
            $sort_order = isset($_GET['order']) ? $_GET['order'] : 'ASC';
            $order_clause = buildOrderByClause($sort_by, $sort_order);
            
            $stmt = $db->query("SELECT * FROM production_matieres WHERE quantite_stock <= quantite_min " . str_replace('m.', '', $order_clause));
            $materials = $stmt->fetchAll();
            
            foreach ($materials as &$material) {
                // Map fields
                $material['material_id'] = $material['id'];
                $material['title'] = $material['nom'];
                $material['quantity_total'] = $material['quantite_stock'];
                $material['lowest_quantity_needed'] = $material['quantite_min'];
                $material['medium_quantity_needed'] = $material['quantite_min'];
                $material['good_quantity_needed'] = $material['quantite_max'];
                
                $material['status'] = calculateStockStatus(
                    $material['quantite_stock'], 
                    $material['quantite_min'], 
                    $material['quantite_min'],
                    $material['quantite_max']
                );
            }
            
            echo json_encode(['success' => true, 'data' => $materials]);
            
        } elseif(isset($_GET['transactions']) && isset($_GET['material_id'])) {
            // Get transaction history for a specific material
            $stmt = $db->prepare("
                SELECT t.*, u.nom as username, 'N/A' as product_title, 'N/A' as order_status
                FROM production_transactions_stock t
                LEFT JOIN production_utilisateurs u ON t.user_id = u.id
                WHERE t.material_id = ?
                ORDER BY t.date_transaction DESC
            ");
            $stmt->execute([$_GET['material_id']]);
            $transactions = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $transactions]);
            
        } else {
            // Get all materials with basic info, categories, images and customer info
            $sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
            $sort_order = isset($_GET['order']) ? $_GET['order'] : 'DESC';
            $order_clause = buildOrderByClause($sort_by, $sort_order);
            
            $stmt = $db->query("
                SELECT m.*, c.nom as category_name, f.name as fournisseur_name, sc.name as customer_name,
                       (SELECT file_path FROM production_images WHERE related_type = 'matiere' AND related_id = m.id ORDER BY upload_date ASC LIMIT 1) as first_image_path
                FROM production_matieres m 
                LEFT JOIN production_matieres_category c ON m.category_id = c.id
                LEFT JOIN production_materials_fournisseurs f ON m.id_fournisseur = f.id AND f.active = 1
                LEFT JOIN production_soustraitance_clients sc ON m.extern_customer_id = sc.id
                " . $order_clause . "
            ");
            $materials = $stmt->fetchAll();
            
            // Process materials to include proper image URLs
            foreach ($materials as &$material) {
                // Set proper image URL or placeholder
                if (!empty($material['first_image_path'])) {
                    $material['image_url'] = "https://luccibyey.com.tn/production/" . $material['first_image_path'];
                } else {
                    $material['image_url'] = "https://via.placeholder.com/64x64/64748b/ffffff?text=" . substr($material['nom'], 0, 3);
                }
            }
            
            echo json_encode(['success' => true, 'data' => $materials]);
        }
        break;

    case 'POST':
        if(isset($input['action']) && $input['action'] === 'stock_transaction') {
            // Handle stock transaction (in/out)
            try {
                $db->beginTransaction();
                
                // Get material's quantity_type_id
                $materialStmt = $db->prepare("SELECT quantity_type_id FROM production_matieres WHERE id = ?");
                $materialStmt->execute([$input['material_id']]);
                $material = $materialStmt->fetch();
                
                if (!$material) {
                    throw new Exception('Material not found');
                }
                
                // Insert transaction record
                $stmt = $db->prepare("
                    INSERT INTO production_transactions_stock 
                    (material_id, quantity_type_id, type_mouvement, quantite, prix_unitaire, cout_total, motif, notes, user_id, date_transaction) 
                    VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, NOW())
                ");
                
                $stmt->execute([
                    $input['material_id'],
                    $material['quantity_type_id'],
                    $input['type'], // 'in' or 'out'
                    $input['quantity'],
                    $input['type'] === 'in' ? 'Stock entry' : 'Stock exit',
                    $input['note'] ?? null,
                    $input['user_id']
                ]);
                
                // Update material quantity
                if($input['type'] === 'in') {
                    $stmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock + ?, updated_at = NOW() WHERE id = ?");
                } else {
                    $stmt = $db->prepare("UPDATE production_matieres SET quantite_stock = quantite_stock - ?, updated_at = NOW() WHERE id = ?");
                }
                
                $stmt->execute([
                    $input['quantity'],
                    $input['material_id']
                ]);
                
                $db->commit();
                echo json_encode(['success' => true, 'message' => 'Stock transaction completed successfully']);
                
            } catch (Exception $e) {
                $db->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error processing stock transaction: ' . $e->getMessage()]);
            }
            
        } else {
            // Create new material
            try {
                // Handle other_attributes
                $other_attributes = null;
                if (isset($input['other_attributes'])) {
                    if (is_string($input['other_attributes'])) {
                        $other_attributes = $input['other_attributes'];
                    } else {
                        $other_attributes = json_encode($input['other_attributes']);
                    }
                }
                
                // Validate required fields
                if (empty($input['title'])) {
                    echo json_encode(['success' => false, 'message' => 'Title is required']);
                    break;
                }
                
                if (empty($input['quantity_type_id'])) {
                    echo json_encode(['success' => false, 'message' => 'Quantity type is required']);
                    break;
                }
                
                // Validate materiere_type and extern_customer_id
                $materiere_type = isset($input['materiere_type']) ? $input['materiere_type'] : 'intern';
                $extern_customer_id = null;
                
                if ($materiere_type === 'extern') {
                    if (!empty($input['extern_customer_id'])) {
                        $extern_customer_id = intval($input['extern_customer_id']);
                    }
                }
                
                // Handle multiple image uploads (up to 3 for materials)
                $uploadedImages = [];
                $uploadedFiles = [];
                
                if ($isFormData) {
                    for ($i = 1; $i <= 3; $i++) {
                        if (isset($_FILES["image{$i}"]) && $_FILES["image{$i}"]['error'] === UPLOAD_ERR_OK) {
                            $file = $_FILES["image{$i}"];
                            
                            // Validate file type
                            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                            $fileType = $file['type'];
                            $fileName = $file['name'];
                            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                            
                            if (!in_array($fileType, $allowedTypes) && !in_array($fileExtension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                                echo json_encode([
                                    'success' => false,
                                    'message' => 'Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP are allowed.'
                                ]);
                                exit;
                            }
                            
                            // Validate file size (max 10MB)
                            $maxSize = 10 * 1024 * 1024; // 10MB in bytes
                            if ($file['size'] > $maxSize) {
                                echo json_encode([
                                    'success' => false,
                                    'message' => 'File size too large. Maximum 10MB allowed.'
                                ]);
                                exit;
                            }
                            
                            // Generate unique filename
                            $uniqueFileName = uniqid('material_') . '_' . time() . '.' . $fileExtension;
                            $uploadPath = '../uploads/' . $uniqueFileName;
                            
                            // Create uploads directory if it doesn't exist
                            if (!is_dir('../uploads')) {
                                mkdir('../uploads', 0755, true);
                            }
                            
                            // Move uploaded file
                            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                                $uploadedImages[] = 'uploads/' . $uniqueFileName;
                                $uploadedFiles[] = $uploadPath;
                            } else {
                                // Clean up previously uploaded files on failure
                                foreach ($uploadedFiles as $filePath) {
                                    if (file_exists($filePath)) {
                                        unlink($filePath);
                                    }
                                }
                                echo json_encode([
                                    'success' => false,
                                    'message' => 'Failed to upload image ' . $i
                                ]);
                                exit;
                            }
                        }
                    }
                }
                
                // Check if new columns exist in the database
                $columnsExist = false;
                try {
                    $checkStmt = $db->prepare("SHOW COLUMNS FROM production_matieres LIKE 'materiere_type'");
                    $checkStmt->execute();
                    $columnsExist = $checkStmt->fetch() !== false;
                } catch (Exception $e) {
                    $columnsExist = false;
                }
                
                if ($columnsExist) {
                    // New version with materiere_type columns
                    $stmt = $db->prepare("
                        INSERT INTO production_matieres 
                        (reference, nom, description, category_id, quantity_type_id, quantite_stock, quantite_min, quantite_max, prix_unitaire, location, couleur, taille, fournisseur, id_fournisseur, image_url, other_attributes, materiere_type, extern_customer_id, active, created_at, updated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                    ");
                    
                    $result = $stmt->execute([
                        $input['reference'] ?? null,
                        $input['title'],
                        $input['description'] ?? null,
                        !empty($input['category_id']) ? intval($input['category_id']) : null,
                        !empty($input['quantity_type_id']) ? intval($input['quantity_type_id']) : null,
                        isset($input['quantity_total']) ? floatval($input['quantity_total']) : 0,
                        isset($input['lowest_quantity_needed']) ? floatval($input['lowest_quantity_needed']) : 0,
                        isset($input['good_quantity_needed']) ? floatval($input['good_quantity_needed']) : 0,
                        isset($input['price']) ? floatval($input['price']) : 0,
                        $input['location'] ?? null,
                        $input['color'] ?? null,
                        $input['size'] ?? null,
                        $input['supplier'] ?? null,
                        !empty($input['id_fournisseur']) ? intval($input['id_fournisseur']) : null,
                        $input['image_url'] ?? null,
                        $other_attributes,
                        $materiere_type,
                        $extern_customer_id
                    ]);
                } else {
                    // Legacy version without materiere_type columns  
                    $stmt = $db->prepare("
                        INSERT INTO production_matieres 
                        (reference, nom, description, category_id, quantity_type_id, quantite_stock, quantite_min, quantite_max, prix_unitaire, location, couleur, taille, fournisseur, id_fournisseur, image_url, other_attributes, active, created_at, updated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                    ");
                    
                    $result = $stmt->execute([
                        $input['reference'] ?? null,
                        $input['title'],
                        $input['description'] ?? null,
                        !empty($input['category_id']) ? intval($input['category_id']) : null,
                        !empty($input['quantity_type_id']) ? intval($input['quantity_type_id']) : null,
                        isset($input['quantity_total']) ? floatval($input['quantity_total']) : 0,
                        isset($input['lowest_quantity_needed']) ? floatval($input['lowest_quantity_needed']) : 0,
                        isset($input['good_quantity_needed']) ? floatval($input['good_quantity_needed']) : 0,
                        isset($input['price']) ? floatval($input['price']) : 0,
                        $input['location'] ?? null,
                        $input['color'] ?? null,
                        $input['size'] ?? null,
                        $input['supplier'] ?? null,
                        !empty($input['id_fournisseur']) ? intval($input['id_fournisseur']) : null,
                        $input['image_url'] ?? null,
                        $other_attributes
                    ]);
                }
                
                if($result) {
                    $material_id = $db->lastInsertId();
                    
                    // Save uploaded images to images table
                    if (!empty($uploadedImages) && $material_id) {
                        foreach ($uploadedImages as $imagePath) {
                            $stmt = $db->prepare("
                                INSERT INTO production_images (related_type, related_id, file_path, uploaded_user, upload_date) 
                                VALUES ('matiere', ?, ?, ?, NOW())
                            ");
                            $stmt->execute([$material_id, $imagePath, 1]);
                        }
                    }
                    
                    // AUTO-LOG INITIAL STOCK: If quantity_total > 0, log as 'in' transaction
                    $initial_quantity = isset($input['quantity_total']) ? floatval($input['quantity_total']) : 0;
                    if ($initial_quantity > 0) {
                        $stmt = $db->prepare("
                            INSERT INTO production_transactions_stock 
                            (material_id, quantity_type_id, type_mouvement, quantite, prix_unitaire, cout_total, motif, user_id, date_transaction) 
                            VALUES (?, ?, 'in', ?, 0, 0, 'Stock initial lors de la création du matériau', ?, NOW())
                        ");
                        $stmt->execute([
                            $material_id,
                            !empty($input['quantity_type_id']) ? intval($input['quantity_type_id']) : null,
                            $initial_quantity,
                            1
                        ]);
                    }
                    
                    echo json_encode(['success' => true, 'message' => 'Material created successfully', 'id' => $material_id]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error creating material']);
                }
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => 'Error creating material: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Update material
        try {
            $db->beginTransaction();
            
            // Handle multiple image uploads (up to 3 for materials) - only for FormData requests
            $uploadedImages = [];
            $uploadedFiles = [];
            
            if ($isFormData) {
                for ($i = 1; $i <= 3; $i++) {
                    if (isset($_FILES["image{$i}"]) && $_FILES["image{$i}"]['error'] === UPLOAD_ERR_OK) {
                        $file = $_FILES["image{$i}"];
                        
                        // Validate file type
                        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                        $fileType = $file['type'];
                        $fileName = $file['name'];
                        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                        
                        if (!in_array($fileType, $allowedTypes) && !in_array($fileExtension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                            throw new Exception('Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP are allowed.');
                        }
                        
                        // Validate file size (max 10MB)
                        $maxSize = 10 * 1024 * 1024; // 10MB in bytes
                        if ($file['size'] > $maxSize) {
                            throw new Exception('File size too large. Maximum 10MB allowed.');
                        }
                        
                        // Generate unique filename
                        $uniqueFileName = uniqid('material_') . '_' . time() . '.' . $fileExtension;
                        $uploadPath = '../uploads/' . $uniqueFileName;
                        
                        // Create uploads directory if it doesn't exist
                        if (!is_dir('../uploads')) {
                            mkdir('../uploads', 0755, true);
                        }
                        
                        // Move uploaded file
                        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                            $uploadedImages[] = 'uploads/' . $uniqueFileName;
                            $uploadedFiles[] = $uploadPath;
                        } else {
                            throw new Exception('Failed to upload image ' . $i);
                        }
                    }
                }
            }
            
            // Handle other_attributes
            $other_attributes = null;
            if (isset($input['other_attributes'])) {
                if (is_string($input['other_attributes'])) {
                    $other_attributes = $input['other_attributes'];
                } else {
                    $other_attributes = json_encode($input['other_attributes']);
                }
            }
            
            // Validate materiere_type and extern_customer_id for updates
            $materiere_type = isset($input['materiere_type']) ? $input['materiere_type'] : null;
            $extern_customer_id = null;
            
            if ($materiere_type === 'extern' && !empty($input['extern_customer_id'])) {
                $extern_customer_id = intval($input['extern_customer_id']);
            }
            
            // GET CURRENT STOCK BEFORE UPDATE (for transaction logging)
            $stmt = $db->prepare("SELECT quantite_stock, quantity_type_id, materiere_type FROM production_matieres WHERE id = ?");
            $stmt->execute([intval($input['material_id'])]);
            $current_material = $stmt->fetch();
            $old_quantity = $current_material ? floatval($current_material['quantite_stock']) : 0;
            $new_quantity = isset($input['quantity_total']) ? floatval($input['quantity_total']) : 0;
            
            // Use existing materiere_type if not provided in update
            if ($materiere_type === null && $current_material) {
                $materiere_type = $current_material['materiere_type'] ?? 'intern';
            }
            
            // Determine quantity_type_id to use (preserve existing if not provided or invalid)
            $current_quantity_type_id = $current_material && isset($current_material['quantity_type_id']) ? intval($current_material['quantity_type_id']) : null;
            $quantity_type_id_to_use = (isset($input['quantity_type_id']) && $input['quantity_type_id'] !== '' && $input['quantity_type_id'] !== null)
                ? intval($input['quantity_type_id'])
                : $current_quantity_type_id;
            // Validate FK exists; if not, fallback to current to avoid constraint errors
            if ($quantity_type_id_to_use !== null) {
                $check = $db->prepare("SELECT id FROM production_quantity_types WHERE id = ?");
                $check->execute([$quantity_type_id_to_use]);
                if (!$check->fetch()) {
                    $quantity_type_id_to_use = $current_quantity_type_id;
                }
            }
            
            // Check if new columns exist in the database
            $columnsExist = false;
            try {
                $checkStmt = $db->prepare("SHOW COLUMNS FROM production_matieres LIKE 'materiere_type'");
                $checkStmt->execute();
                $columnsExist = $checkStmt->fetch() !== false;
            } catch (Exception $e) {
                $columnsExist = false;
            }
            
            if ($columnsExist) {
                // New version with materiere_type columns
                $stmt = $db->prepare("
                    UPDATE production_matieres 
                    SET reference=?, nom=?, description=?, category_id=?, quantity_type_id=?, quantite_stock=?, quantite_min=?, quantite_max=?, prix_unitaire=?, location=?, couleur=?, taille=?, fournisseur=?, id_fournisseur=?, other_attributes=?, materiere_type=?, extern_customer_id=?, updated_at=NOW() 
                    WHERE id=?
                ");
                
                $result = $stmt->execute([
                    $input['reference'] ?? null,
                    $input['title'],
                    $input['description'] ?? null,
                    !empty($input['category_id']) ? intval($input['category_id']) : null,
                    $quantity_type_id_to_use,
                    isset($input['quantity_total']) ? floatval($input['quantity_total']) : 0,
                    isset($input['lowest_quantity_needed']) ? floatval($input['lowest_quantity_needed']) : 0,
                    isset($input['medium_quantity_needed']) ? floatval($input['medium_quantity_needed']) : 0,
                    isset($input['price']) ? floatval($input['price']) : 0,
                    $input['location'] ?? null,
                    $input['color'] ?? null,
                    $input['size'] ?? null,
                    $input['supplier'] ?? null,
                    !empty($input['id_fournisseur']) ? intval($input['id_fournisseur']) : null,
                    $other_attributes,
                    $materiere_type,
                    $extern_customer_id,
                    intval($input['material_id'])
                ]);
            } else {
                // Legacy version without materiere_type columns
                $stmt = $db->prepare("
                    UPDATE production_matieres 
                    SET reference=?, nom=?, description=?, category_id=?, quantity_type_id=?, quantite_stock=?, quantite_min=?, quantite_max=?, prix_unitaire=?, location=?, couleur=?, taille=?, fournisseur=?, id_fournisseur=?, other_attributes=?, updated_at=NOW() 
                    WHERE id=?
                ");
                
                $result = $stmt->execute([
                    $input['reference'] ?? null,
                    $input['title'],
                    $input['description'] ?? null,
                    !empty($input['category_id']) ? intval($input['category_id']) : null,
                    $quantity_type_id_to_use,
                    isset($input['quantity_total']) ? floatval($input['quantity_total']) : 0,
                    isset($input['lowest_quantity_needed']) ? floatval($input['lowest_quantity_needed']) : 0,
                    isset($input['medium_quantity_needed']) ? floatval($input['medium_quantity_needed']) : 0,
                    isset($input['price']) ? floatval($input['price']) : 0,
                    $input['location'] ?? null,
                    $input['color'] ?? null,
                    $input['size'] ?? null,
                    $input['supplier'] ?? null,
                    !empty($input['id_fournisseur']) ? intval($input['id_fournisseur']) : null,
                    $other_attributes,
                    intval($input['material_id'])
                ]);
            }
            
            if($result) {
                // Save new uploaded images to images table
                if (!empty($uploadedImages)) {
                    foreach ($uploadedImages as $imagePath) {
                        $stmt = $db->prepare("
                            INSERT INTO production_images (related_type, related_id, file_path, uploaded_user, upload_date) 
                            VALUES ('material', ?, ?, ?, NOW())
                        ");
                        $stmt->execute([intval($input['material_id']), $imagePath, 1]);
                    }
                }
                
                // AUTO-LOG STOCK CHANGES: Only log if quantity_total changed
                if ($old_quantity != $new_quantity) {
                    $quantity_difference = $new_quantity - $old_quantity;
                    $transaction_type = $quantity_difference > 0 ? 'in' : 'out';
                    $abs_quantity = abs($quantity_difference);
                    
                    if ($abs_quantity > 0) {
                        $stmt = $db->prepare("
                            INSERT INTO production_transactions_stock 
                            (material_id, type_mouvement, quantite, prix_unitaire, cout_total, motif, user_id, date_transaction) 
                            VALUES (?, ?, ?, 0, 0, ?, ?, NOW())
                        ");
                        
                        $note = $transaction_type === 'in' 
                            ? "Ajustement stock: +{$abs_quantity} (modification manuelle)" 
                            : "Ajustement stock: -{$abs_quantity} (modification manuelle)";
                            
                        $stmt->execute([
                            intval($input['material_id']),
                            $transaction_type,
                            $abs_quantity,
                            $note,
                            1
                        ]);
                    }
                }
                
                // Commit transaction after all operations succeed
                $db->commit();
                echo json_encode(['success' => true, 'message' => 'Material updated successfully']);
            } else {
                // Rollback if update failed
                $db->rollBack();
                echo json_encode(['success' => false, 'message' => 'Error updating material']);
            }
        } catch (Exception $e) {
            if ($db->inTransaction()) { $db->rollBack(); }
            echo json_encode(['success' => false, 'message' => 'Error updating material: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete material (with transaction check)
        try {
            $db->beginTransaction();
            
            // Check if material has transactions
            $stmt = $db->prepare("SELECT COUNT(*) as transaction_count FROM production_transactions_stock WHERE material_id = ?");
            $stmt->execute([$input['material_id']]);
            $result = $stmt->fetch();
            
            if($result['transaction_count'] > 0) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete material with existing transactions']);
                break;
            }
            
            // Delete related images first
            $stmt = $db->prepare("DELETE FROM production_images WHERE related_type = 'matiere' AND related_id = ?");
            $stmt->execute([$input['material_id']]);
            
            // Delete material
            $stmt = $db->prepare("DELETE FROM production_matieres WHERE id = ?");
            $result = $stmt->execute([$input['material_id']]);
            
            $db->commit();
            
            if($result) {
                echo json_encode(['success' => true, 'message' => 'Material deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error deleting material']);
            }
            
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Error deleting material: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>
