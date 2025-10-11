<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        if(isset($_GET['product_id'])) {
            // Get measurements for specific product, grouped by measurement_name
            $stmt = $db->prepare("
                SELECT 
                    measurement_name,
                    size_value,
                    measurement_value,
                    tolerance,
                    unit,
                    notes,
                    created_at,
                    updated_at
                FROM production_ready_products_mesure 
                WHERE product_id = ? 
                ORDER BY measurement_name ASC, 
                    CASE 
                        WHEN size_value REGEXP '^[0-9]+$' THEN CAST(size_value AS UNSIGNED)
                        ELSE 
                            CASE size_value 
                                WHEN 'XS' THEN 1
                                WHEN 'S' THEN 2
                                WHEN 'M' THEN 3
                                WHEN 'L' THEN 4
                                WHEN 'XL' THEN 5
                                WHEN 'XXL' THEN 6
                                WHEN '3XL' THEN 7
                                WHEN '4XL' THEN 8
                                ELSE 9
                            END
                    END ASC
            ");
            $stmt->execute([$_GET['product_id']]);
            $measurements = $stmt->fetchAll();
            
            // Group measurements by measurement_name
            $groupedData = [];
            foreach ($measurements as $measurement) {
                $name = $measurement['measurement_name'];
                if (!isset($groupedData[$name])) {
                    $groupedData[$name] = [
                        'measurement_name' => $name,
                        'tolerance' => $measurement['tolerance'],
                        'unit' => $measurement['unit'],
                        'notes' => $measurement['notes'],
                        'sizes' => []
                    ];
                }
                $groupedData[$name]['sizes'][$measurement['size_value']] = $measurement['measurement_value'];
            }
            
            echo json_encode(['success' => true, 'data' => array_values($groupedData)]);
        } else {
            // Get all measurements with product info
            $stmt = $db->query("
                SELECT m.*, p.nom_product, p.reference_product
                FROM production_ready_products_mesure m
                JOIN production_ready_products p ON m.product_id = p.id
                ORDER BY p.nom_product ASC, m.measurement_name ASC, m.size_value ASC
            ");
            $measurements = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $measurements]);
        }
        break;

    case 'POST':
        // Create or update measurements for a product
        if (!isset($input['product_id']) || !isset($input['measurements'])) {
            echo json_encode(['success' => false, 'message' => 'Product ID and measurements data are required']);
            break;
        }

        try {
            $db->beginTransaction();
            
            $productId = $input['product_id'];
            $measurements = $input['measurements'];
            
            foreach ($measurements as $measurementData) {
                $measurementName = $measurementData['measurement_name'];
                $tolerance = $measurementData['tolerance'] ?? 0.5;
                $unit = $measurementData['unit'] ?? 'cm';
                $notes = $measurementData['notes'] ?? null;
                $sizes = $measurementData['sizes'] ?? [];
                
                foreach ($sizes as $sizeValue => $measurementValue) {
                    // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert
                    $stmt = $db->prepare("
                        INSERT INTO production_ready_products_mesure 
                        (product_id, measurement_name, size_value, measurement_value, tolerance, unit, notes) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        measurement_value = VALUES(measurement_value),
                        tolerance = VALUES(tolerance),
                        unit = VALUES(unit),
                        notes = VALUES(notes),
                        updated_at = CURRENT_TIMESTAMP
                    ");
                    
                    $stmt->execute([
                        $productId,
                        $measurementName,
                        $sizeValue,
                        $measurementValue,
                        $tolerance,
                        $unit,
                        $notes
                    ]);
                }
            }
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Measurements saved successfully']);
            
        } catch (Exception $e) {
            $db->rollback();
            echo json_encode(['success' => false, 'message' => 'Error saving measurements: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete measurement type (all sizes for a measurement)
        if (!isset($input['product_id']) || !isset($input['measurement_name'])) {
            echo json_encode(['success' => false, 'message' => 'Product ID and measurement name are required']);
            break;
        }

        $stmt = $db->prepare("DELETE FROM production_ready_products_mesure WHERE product_id = ? AND measurement_name = ?");
        $result = $stmt->execute([$input['product_id'], $input['measurement_name']]);
        
        if($result) {
            echo json_encode(['success' => true, 'message' => 'Measurement type deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting measurement type']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>