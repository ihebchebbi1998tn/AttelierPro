<?php
require_once 'config.php';

$database = new Database();
$conn = $database->getConnection();

try {
    // Read and execute the SQL file
    $sql = file_get_contents(__DIR__ . '/add_password_to_soustraitance_clients.sql');
    
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $conn->exec($statement);
                echo "✓ Statement executed successfully\n";
            } catch (PDOException $e) {
                // Ignore "Duplicate column" errors if running multiple times
                if (strpos($e->getMessage(), 'Duplicate column') === false) {
                    echo "✗ Error: " . $e->getMessage() . "\n";
                } else {
                    echo "⚠ Column already exists, skipping...\n";
                }
            }
        }
    }
    
    echo "\n✓ Soustraitance authentication setup completed successfully!\n";
    echo "\nNOTE: Existing clients now have default password: 'password123'\n";
    echo "Please ask clients to change their password on first login.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
