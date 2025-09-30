<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Redirect to the new enhanced transfer API
$input = json_decode(file_get_contents('php://input'), true);

// Forward the request to the new API
$url = 'https://luccibyey.com.tn/production/api/transfer_products_with_quantities.php';
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($input)
    ]
];
$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo $result;
?>