<?php
require_once 'config.php';

// Additional CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        // Test basic connection
        $result = ['success' => true, 'message' => 'Database connection successful'];
        
        // Check if tables exist
        $tables = [
            'production_matieres',
            'production_transactions_stock', 
            'production_utilisateurs',
            'production_matieres_category',
            'production_quantity_types'
        ];
        
        $existing_tables = [];
        $missing_tables = [];
        
        foreach ($tables as $table) {
            try {
                $stmt = $db->query("SELECT 1 FROM $table LIMIT 1");
                $existing_tables[] = $table;
            } catch (Exception $e) {
                $missing_tables[] = $table;
            }
        }
        
        $result['existing_tables'] = $existing_tables;
        $result['missing_tables'] = $missing_tables;
        
        // Test data counts
        if (empty($missing_tables)) {
            try {
                $stmt = $db->query("SELECT COUNT(*) as count FROM production_matieres");
                $materials_count = $stmt->fetch()['count'];
                
                $stmt = $db->query("SELECT COUNT(*) as count FROM production_transactions_stock");
                $transactions_count = $stmt->fetch()['count'];
                
                $stmt = $db->query("SELECT COUNT(*) as count FROM production_utilisateurs");
                $users_count = $stmt->fetch()['count'];
                
                $result['data_counts'] = [
                    'materials' => $materials_count,
                    'transactions' => $transactions_count,
                    'users' => $users_count
                ];
            } catch (Exception $e) {
                $result['data_counts_error'] = $e->getMessage();
            }
        }
        
        echo json_encode($result);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to connect to database']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>