<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Check if photo column already exists
    $stmt = $db->query("SHOW COLUMNS FROM production_employees LIKE 'photo'");
    $columnExists = $stmt->fetch();
    
    if ($columnExists) {
        echo json_encode([
            'success' => false,
            'message' => 'La colonne photo existe déjà dans la table production_employees'
        ]);
        exit;
    }
    
    // Add photo column
    $sql = "ALTER TABLE production_employees ADD COLUMN photo VARCHAR(255) NULL AFTER actif";
    $db->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Colonne photo ajoutée avec succès à la table production_employees'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
?>
