<?php
require_once 'config.php';

$database = new Database();
$conn = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

// Get action from request
$action = $data['action'] ?? '';

try {
    switch ($action) {
        case 'login':
            handleLogin($conn, $data);
            break;
        
        case 'verify':
            handleVerify($conn, $data);
            break;
        
        case 'register':
            handleRegister($conn, $data);
            break;
        
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

function handleLogin($conn, $data) {
    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit;
    }

    $username = $data['username'];
    $password = $data['password'];

    // First, try to authenticate as regular user (production_utilisateurs)
    $stmt = $conn->prepare("SELECT * FROM production_utilisateurs WHERE email = ? OR nom = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Regular user authentication successful
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'nom' => $user['nom'],
                'email' => $user['email'],
                'role' => $user['role'],
                'user_type' => 'regular'
            ],
            'token' => base64_encode($user['id'] . ':' . $user['email'] . ':' . time())
        ]);
        exit;
    }

    // If not found in regular users, try soustraitance clients
    $stmt = $conn->prepare("SELECT * FROM production_soustraitance_clients WHERE email = ? AND is_active = 1");
    $stmt->execute([$username]);
    $client = $stmt->fetch();

    if ($client && $client['password'] && password_verify($password, $client['password'])) {
        // Update last login
        $updateStmt = $conn->prepare("UPDATE production_soustraitance_clients SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$client['id']]);

        // Soustraitance client authentication successful
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $client['id'],
                'nom' => $client['name'],
                'email' => $client['email'],
                'role' => 'sous_traitance',
                'user_type' => 'sous_traitance',
                'phone' => $client['phone'],
                'address' => $client['address']
            ],
            'token' => base64_encode($client['id'] . ':' . $client['email'] . ':sous_traitance:' . time())
        ]);
        exit;
    }

    // Authentication failed
    echo json_encode([
        'success' => false,
        'message' => 'Invalid credentials'
    ]);
}

function handleVerify($conn, $data) {
    if (!isset($data['token'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Token is required'
        ]);
        exit;
    }

    $token = $data['token'];
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);

    if (count($parts) < 3) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid token format'
        ]);
        exit;
    }

    $userId = $parts[0];
    $email = $parts[1];
    
    // Check if this is a soustraitance client token
    if (count($parts) === 4 && $parts[2] === 'sous_traitance') {
        $stmt = $conn->prepare("SELECT * FROM production_soustraitance_clients WHERE id = ? AND email = ? AND is_active = 1");
        $stmt->execute([$userId, $email]);
        $client = $stmt->fetch();

        if ($client) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $client['id'],
                    'nom' => $client['name'],
                    'email' => $client['email'],
                    'role' => 'sous_traitance',
                    'user_type' => 'sous_traitance',
                    'phone' => $client['phone'],
                    'address' => $client['address']
                ]
            ]);
            exit;
        }
    } else {
        // Regular user token
        $stmt = $conn->prepare("SELECT * FROM production_utilisateurs WHERE id = ? AND email = ?");
        $stmt->execute([$userId, $email]);
        $user = $stmt->fetch();

        if ($user) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'nom' => $user['nom'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'user_type' => 'regular'
                ]
            ]);
            exit;
        }
    }

    echo json_encode([
        'success' => false,
        'message' => 'Invalid or expired token'
    ]);
}

function handleRegister($conn, $data) {
    if (!isset($data['nom']) || !isset($data['email']) || !isset($data['password'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Name, email and password are required'
        ]);
        exit;
    }

    $nom = $data['nom'];
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $role = $data['role'] ?? 'production';

    // Check if user already exists
    $stmt = $conn->prepare("SELECT * FROM production_utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'User already exists'
        ]);
        exit;
    }

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO production_utilisateurs (nom, email, password, role) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$nom, $email, $password, $role])) {
        $userId = $conn->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'user' => [
                'id' => $userId,
                'nom' => $nom,
                'email' => $email,
                'role' => $role,
                'user_type' => 'regular'
            ],
            'token' => base64_encode($userId . ':' . $email . ':' . time())
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Registration failed'
        ]);
    }
}
?>
