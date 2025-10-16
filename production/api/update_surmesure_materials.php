<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    switch($method) {
        case 'POST':
            if (!isset($input['commande_id']) || !isset($input['selected_matieres'])) {
                echo json_encode(['success' => false, 'message' => 'Missing required fields: commande_id and selected_matieres']);
                exit;
            }

            $commandeId = $input['commande_id'];
            $selectedMatieres = $input['selected_matieres'];

            // Validate that selected_matieres is an array
            if (!is_array($selectedMatieres)) {
                echo json_encode(['success' => false, 'message' => 'selected_matieres must be an array']);
                exit;
            }

            // Update the selected_matieres field in the database
            $stmt = $db->prepare("
                UPDATE production_surmesure_commandes 
                SET selected_matieres = ? 
                WHERE id = ?
            ");

            $result = $stmt->execute([
                json_encode($selectedMatieres),
                $commandeId
            ]);

            if ($result) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Materials updated successfully',
                    'data' => [
                        'commande_id' => $commandeId,
                        'selected_matieres' => $selectedMatieres
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error updating materials']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
