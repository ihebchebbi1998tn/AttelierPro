<?php
// Setup script to create the surmesure materials table
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Read and execute the SQL file
    $sql = file_get_contents('create_surmesure_matieres_table.sql');
    
    // Split SQL commands by semicolons and execute each one
    $commands = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($commands as $command) {
        if (!empty($command)) {
            $stmt = $db->prepare($command);
            $stmt->execute();
        }
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Table production_surmesure_matieres créée avec succès'
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la création de la table: ' . $e->getMessage()
    ]);
}
?>