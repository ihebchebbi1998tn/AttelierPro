<?php
require_once 'config.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $sql = file_get_contents(__DIR__ . '/add_chef_de_famille_sexe.sql');
    
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Chef de famille and sexe columns added successfully'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
