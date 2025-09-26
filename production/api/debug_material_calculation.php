<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    $product_id = $_GET['product_id'] ?? 7; // CEINTURE product ID
    
    echo "<h2>Debug Material Calculation for Product ID: $product_id</h2>";
    
    // 1. Check product materials configuration
    echo "<h3>1. Product Materials Configuration:</h3>";
    $materialsStmt = $pdo->prepare("
        SELECT 
            pm.*, 
            m.nom as material_name,
            m.quantite_stock as stock, 
            m.prix_unitaire as price,
            m.quantity_type_id as material_quantity_type_id,
            qt.name as quantity_type_name
        FROM production_product_materials pm
        JOIN production_matieres m ON pm.material_id = m.id
        LEFT JOIN production_quantity_types qt ON pm.quantity_type_id = qt.id
        WHERE pm.product_id = ?
        ORDER BY pm.material_id, pm.size_specific
    ");
    $materialsStmt->execute([$product_id]);
    $materials = $materialsStmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Material ID</th><th>Material Name</th><th>Size Specific</th><th>Quantity Needed</th><th>Stock</th><th>Price</th></tr>";
    
    foreach ($materials as $mat) {
        echo "<tr>";
        echo "<td>{$mat['material_id']}</td>";
        echo "<td>{$mat['material_name']}</td>";
        echo "<td>" . ($mat['size_specific'] ?: 'General') . "</td>";
        echo "<td>{$mat['quantity_needed']}</td>";
        echo "<td>{$mat['stock']}</td>";
        echo "<td>{$mat['price']}</td>";
        echo "</tr>";
    }
    echo "</table><br>";
    
    // 2. Simulate production calculation for size 30 only
    echo "<h3>2. Simulated Production Calculation (Size 30 only):</h3>";
    $sizes_breakdown = '{"30":1}';
    $sizesData = json_decode($sizes_breakdown, true);
    $totalPlannedPieces = array_sum(array_map('intval', $sizesData));
    
    echo "Sizes Data: " . print_r($sizesData, true) . "<br>";
    echo "Total Planned Pieces: $totalPlannedPieces<br><br>";
    
    $processedKeys = [];
    $totalCost = 0;
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Material</th><th>Size Specific</th><th>Planned Pieces</th><th>Quantity Needed</th><th>Total Consumption</th><th>Key</th><th>Status</th></tr>";
    
    foreach ($materials as $mat) {
        $sizeSpecific = $mat['size_specific'] ?? null;
        $key = $mat['material_id'] . '|' . ($sizeSpecific ? $sizeSpecific : 'none');
        
        // Check if this key was already processed
        $status = isset($processedKeys[$key]) ? 'DUPLICATE (SKIPPED)' : 'PROCESSED';
        
        if (isset($processedKeys[$key])) {
            echo "<tr style='background-color: #ffcccc;'>";
            echo "<td>{$mat['material_name']}</td>";
            echo "<td>" . ($sizeSpecific ?: 'General') . "</td>";
            echo "<td>-</td>";
            echo "<td>{$mat['quantity_needed']}</td>";
            echo "<td>SKIPPED</td>";
            echo "<td>$key</td>";
            echo "<td>$status</td>";
            echo "</tr>";
            continue;
        }
        $processedKeys[$key] = true;
        
        // Determine planned pieces for this config
        if ($sizeSpecific && $sizeSpecific !== 'none') {
            $plannedPieces = isset($sizesData[$sizeSpecific]) ? (int)$sizesData[$sizeSpecific] : 0;
        } else {
            $plannedPieces = $totalPlannedPieces;
        }
        
        $needed = (float)$mat['quantity_needed'] * $plannedPieces;
        $totalCost += $needed * $mat['price'];
        
        echo "<tr style='background-color: #ccffcc;'>";
        echo "<td>{$mat['material_name']}</td>";
        echo "<td>" . ($sizeSpecific ?: 'General') . "</td>";
        echo "<td>$plannedPieces</td>";
        echo "<td>{$mat['quantity_needed']}</td>";
        echo "<td>$needed</td>";
        echo "<td>$key</td>";
        echo "<td>$status</td>";
        echo "</tr>";
    }
    echo "</table><br>";
    
    echo "<h3>3. Check for Potential Issues:</h3>";
    
    // Check for duplicate material configurations
    $duplicateCheck = $pdo->prepare("
        SELECT material_id, size_specific, COUNT(*) as count
        FROM production_product_materials 
        WHERE product_id = ?
        GROUP BY material_id, size_specific
        HAVING COUNT(*) > 1
    ");
    $duplicateCheck->execute([$product_id]);
    $duplicates = $duplicateCheck->fetchAll();
    
    if ($duplicates) {
        echo "<h4>⚠️ DUPLICATE CONFIGURATIONS FOUND:</h4>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Material ID</th><th>Size Specific</th><th>Count</th></tr>";
        foreach ($duplicates as $dup) {
            echo "<tr style='background-color: #ffcccc;'>";
            echo "<td>{$dup['material_id']}</td>";
            echo "<td>" . ($dup['size_specific'] ?: 'General') . "</td>";
            echo "<td>{$dup['count']}</td>";
            echo "</tr>";
        }
        echo "</table><br>";
    } else {
        echo "✅ No duplicate configurations found.<br><br>";
    }
    
    // Check recent batch transactions for this product
    echo "<h3>4. Recent Batch Transactions:</h3>";
    $transactionCheck = $pdo->prepare("
        SELECT 
            b.batch_reference,
            b.sizes_breakdown,
            b.quantity_to_produce,
            t.material_id,
            m.nom as material_name,
            t.quantite as consumed_quantity,
            t.motif,
            t.date_transaction
        FROM production_batches b
        JOIN production_transactions_stock t ON t.motif LIKE CONCAT('%', b.batch_reference, '%')
        JOIN production_matieres m ON t.material_id = m.id
        WHERE b.product_id = ?
        AND t.type_mouvement = 'out'
        ORDER BY t.date_transaction DESC
        LIMIT 10
    ");
    $transactionCheck->execute([$product_id]);
    $transactions = $transactionCheck->fetchAll();
    
    if ($transactions) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Batch</th><th>Sizes</th><th>Total Qty</th><th>Material</th><th>Consumed</th><th>Date</th></tr>";
        foreach ($transactions as $trans) {
            echo "<tr>";
            echo "<td>{$trans['batch_reference']}</td>";
            echo "<td>{$trans['sizes_breakdown']}</td>";
            echo "<td>{$trans['quantity_to_produce']}</td>";
            echo "<td>{$trans['material_name']}</td>";
            echo "<td>{$trans['consumed_quantity']}</td>";
            echo "<td>{$trans['date_transaction']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No recent transactions found.";
    }
    
} catch (Exception $e) {
    echo "<h3>❌ Error: " . $e->getMessage() . "</h3>";
    error_log("Error in debug_material_calculation.php: " . $e->getMessage());
}
?>