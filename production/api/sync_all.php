<?php
require_once 'config.php';

$userId = $_GET['user_id'] ?? 1;
$startTime = microtime(true);

try {
    $results = [];
    
    // Synchroniser Lucci By Ey
    $lucciBySyncUrl = "sync_luccibyey.php?user_id=$userId";
    $lucciResponse = file_get_contents($lucciBySyncUrl);
    $lucciData = json_decode($lucciResponse, true);
    $results['luccibyey'] = $lucciData;
    
    // Synchroniser Spadadibattaglia
    $spadadiSyncUrl = "sync_spadadibattaglia.php?user_id=$userId";
    $spadadiResponse = file_get_contents($spadadiSyncUrl);
    $spadadiData = json_decode($spadadiResponse, true);
    $results['spadadibattaglia'] = $spadadiData;
    
    $endTime = microtime(true);
    $totalDuration = round(($endTime - $startTime) * 1000);
    
    // Calculer les totaux
    $totalFound = 0;
    $totalAdded = 0;
    $totalUpdated = 0;
    $hasErrors = false;
    
    foreach ($results as $boutique => $result) {
        if ($result['success']) {
            $totalFound += $result['data']['products_found'];
            $totalAdded += $result['data']['products_added'];
            $totalUpdated += $result['data']['products_updated'];
        } else {
            $hasErrors = true;
        }
    }
    
    echo json_encode([
        'success' => !$hasErrors,
        'message' => $hasErrors ? 'Synchronisation terminée avec des erreurs' : 'Synchronisation complète terminée avec succès',
        'data' => [
            'total_duration_ms' => $totalDuration,
            'summary' => [
                'total_products_found' => $totalFound,
                'total_products_added' => $totalAdded,
                'total_products_updated' => $totalUpdated
            ],
            'details' => $results
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la synchronisation complète: ' . $e->getMessage()
    ]);
}
?>