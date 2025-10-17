<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Read the SQL file
    $sql = file_get_contents(__DIR__ . '/alter_employe_pointage_add_columns.sql');
    
    if ($sql === false) {
        throw new Exception("Could not read SQL file");
    }
    
    // Remove comments and split by semicolon
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && !preg_match('/^--/', $stmt);
        }
    );
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $db->exec($statement);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed successfully - All Excel import columns added to production_employe_pointage table'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Migration failed: ' . $e->getMessage()
    ]);
}
?>
