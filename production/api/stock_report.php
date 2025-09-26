<?php
// Stock report email endpoint
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function sendEmailHtml(string $to, string $subject, string $htmlMessage, string $fromName = 'Luccy', string $fromEmail = 'contact@luccibyey.com.tn'): bool {
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: " . $fromName . " <" . $fromEmail . ">" . "\r\n";
    $headers .= "Reply-To: " . $fromEmail . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $success = @mail($to, $subject, $htmlMessage, $headers);

    if (!$success) {
        error_log("❌ Mail() failed. To={$to}, Subject={$subject}");
    }

    return (bool) $success;
}

function calculateStockStatus($quantity, $seuil_critique, $seuil_faible) {
    if ($quantity <= $seuil_critique) {
        return 'critical';
    } elseif ($quantity <= $seuil_faible) {
        return 'warning';
    } else {
        return 'good';
    }
}

function getStockData() {
    try {
        $database = new Database();
        $conn = $database->getConnection();
        
        $query = "SELECT m.*, c.nom as category_name 
                  FROM production_matieres m 
                  LEFT JOIN production_matieres_category c ON m.category_id = c.id 
                  ORDER BY m.nom";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            error_log("⚠️ No rows returned from database for stock report.");
            return [];
        }
        
        $materials = [];
        while ($row = $stmt->fetch()) {
            // Validate row data before adding
            if (
                !isset($row['nom']) || !isset($row['quantite_stock']) ||
                !isset($row['quantite_min']) || !isset($row['quantite_max'])
            ) {
                error_log("⚠️ Incomplete row skipped: " . json_encode($row));
                continue;
            }

            $status = calculateStockStatus(
                (float) $row['quantite_stock'],
                (float) $row['quantite_min'],
                (float) $row['quantite_max']
            );

            $materials[] = [
                'nom' => $row['nom'],
                'quantite' => $row['quantite_stock'],
                'unite' => 'unité', // Default unit
                'category_name' => $row['category_name'] ?? 'Non catégorisé',
                'status' => $status,
                'seuil_critique' => $row['quantite_min'],
                'seuil_faible' => $row['quantite_max']
            ];
        }
        
        // Sort by status priority: critical first, then warning, then good
        usort($materials, function($a, $b) {
            $statusOrder = ['critical' => 0, 'warning' => 1, 'good' => 2];
            $aOrder = $statusOrder[$a['status']] ?? 3;
            $bOrder = $statusOrder[$b['status']] ?? 3;
            
            if ($aOrder === $bOrder) {
                return strcmp($a['nom'], $b['nom']);
            }
            
            return $aOrder - $bOrder;
        });
        
        return $materials;
    } catch (Exception $e) {
        error_log("❌ Database error in getStockData: " . $e->getMessage());
        return [];
    }
}

function sendStockReportEmail(): bool {
    $to = 'erzerino2@gmail.com';
    $materials = getStockData();

    if (empty($materials)) {
        error_log("❌ No valid materials data, email not sent.");
        return false;
    }

    $criticalCount = count(array_filter($materials, fn($m) => $m['status'] === 'critical'));
    $warningCount = count(array_filter($materials, fn($m) => $m['status'] === 'warning'));
    $goodCount = count(array_filter($materials, fn($m) => $m['status'] === 'good'));
    $totalCount = count($materials);
    
    $currentDate = date('d/m/Y à H:i');
    
    $subject = "Résumé du Stock - Luccy (" . $currentDate . ")";
    $fromName = 'Luccy Stock System';
    $fromEmail = 'contact@luccibyey.com.tn';
    
    // Build materials HTML
    $materialsHtml = '';
    $currentStatus = '';
    
    foreach ($materials as $material) {
        if ($currentStatus !== $material['status']) {
            if ($currentStatus !== '') {
                $materialsHtml .= '</tbody></table></div>';
            }
            
            $currentStatus = $material['status'];
            $statusLabel = '';
            $statusColor = '';
            $statusBg = '';
            
            switch ($material['status']) {
                case 'critical':
                    $statusLabel = 'Stock Critique';
                    $statusColor = '#dc2626';
                    $statusBg = '#fef2f2';
                    break;
                case 'warning':
                    $statusLabel = 'Stock Faible';
                    $statusColor = '#d97706';
                    $statusBg = '#fffbeb';
                    break;
                case 'good':
                    $statusLabel = 'Stock Bon';
                    $statusColor = '#16a34a';
                    $statusBg = '#f0fdf4';
                    break;
            }
            
            $materialsHtml .= '<div style="margin-bottom: 24px;">';
            $materialsHtml .= '<h3 style="color: ' . $statusColor . '; background: ' . $statusBg . '; padding: 12px 16px; margin: 0 0 16px 0; border-radius: 8px; border-left: 4px solid ' . $statusColor . ';">' . $statusLabel . '</h3>';
            $materialsHtml .= '<table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">';
            $materialsHtml .= '<thead><tr style="background: #f8fafc;"><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Matière</th><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Catégorie</th><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Quantité</th><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Seuils</th></tr></thead>';
            $materialsHtml .= '<tbody>';
        }
        
        $materialsHtml .= '<tr>';
        $materialsHtml .= '<td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 500;">' . htmlspecialchars($material['nom']) . '</td>';
        $materialsHtml .= '<td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">' . htmlspecialchars($material['category_name']) . '</td>';
        $materialsHtml .= '<td style="padding: 12px; border-bottom: 1px solid #f1f5f9;"><strong>' . number_format($material['quantite'], 2) . ' ' . htmlspecialchars($material['unite']) . '</strong></td>';
        $materialsHtml .= '<td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">Critique: ' . $material['seuil_critique'] . ' | Faible: ' . $material['seuil_faible'] . '</td>';
        $materialsHtml .= '</tr>';
    }
    
    if ($currentStatus !== '') {
        $materialsHtml .= '</tbody></table></div>';
    }
    
    $html = '<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Résumé du Stock - Luccy</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px;">
    <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: #0f172a; color: white; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0;">📊 Résumé du Stock</h1>
            <p style="margin: 0;">Rapport généré le ' . $currentDate . '</p>
        </div>
        <div style="padding: 32px 24px;">
            <p><strong>Bonjour Yassine,</strong></p>
            <p>Voici le résumé complet de votre stock avec <strong>' . $totalCount . ' matières</strong> :</p>
            <div style="display: flex; gap: 16px; margin-bottom: 32px;">
                <div style="flex: 1; background: #fef2f2; padding: 16px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #dc2626;">' . $criticalCount . '</div>
                    <div>Stock Critique</div>
                </div>
                <div style="flex: 1; background: #fffbeb; padding: 16px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #d97706;">' . $warningCount . '</div>
                    <div>Stock Faible</div>
                </div>
                <div style="flex: 1; background: #f0fdf4; padding: 16px; text-align: center; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #16a34a;">' . $goodCount . '</div>
                    <div>Stock Bon</div>
                </div>
            </div>
            ' . $materialsHtml . '
        </div>
    </div>
</body>
</html>';

    return sendEmailHtml($to, $subject, $html, $fromName, $fromEmail);
}

// Handle request
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $success = sendStockReportEmail();
        echo json_encode([
            'success' => $success,
            'message' => $success ? 'Rapport de stock envoyé avec succès' : 'Erreur lors de l\'envoi du rapport (voir logs)'
        ]);
    } catch (Exception $e) {
        error_log("❌ Fatal error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur: ' . $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
