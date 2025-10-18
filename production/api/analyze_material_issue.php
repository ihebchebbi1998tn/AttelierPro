<?php
header('Content-Type: text/html');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    $product_id = $_GET['product_id'] ?? 7; // CEINTURE
    
    echo "<h1>🔍 Material Consumption Analysis for Product ID: $product_id</h1>";
    echo "<style>
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .duplicate { background-color: #ffcccc; }
        .normal { background-color: #ccffcc; }
        .warning { background-color: #ffeecc; }
    </style>";
    
    // 1. Check product_materials configuration
    echo "<h2>📋 1. Product Materials Configuration</h2>";
    $stmt = $pdo->prepare("
        SELECT 
            pm.id,
            pm.product_id,
            pm.material_id,
            pm.quantity_needed,
            pm.size_specific,
            m.nom as material_name,
            m.reference as material_ref,
            qt.name as quantity_type_name
        FROM production_product_materials pm
        JOIN production_matieres m ON pm.material_id = m.id
        LEFT JOIN production_quantity_types qt ON pm.quantity_type_id = qt.id
        WHERE pm.product_id = ?
        ORDER BY pm.material_id, pm.size_specific
    ");
    $stmt->execute([$product_id]);
    $materials = $stmt->fetchAll();
    
    echo "<table>";
    echo "<tr><th>ID</th><th>Material ID</th><th>Material Name</th><th>Size Specific</th><th>Quantity Needed</th><th>Qty Type</th></tr>";
    foreach ($materials as $mat) {
        echo "<tr>";
        echo "<td>{$mat['id']}</td>";
        echo "<td>{$mat['material_id']}</td>";
        echo "<td>{$mat['material_name']} ({$mat['material_ref']})</td>";
        echo "<td>" . ($mat['size_specific'] ?: 'ALL SIZES') . "</td>";
        echo "<td>{$mat['quantity_needed']}</td>";
        echo "<td>{$mat['quantity_type_name']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 2. Check for duplicates
    echo "<h2>⚠️ 2. Duplicate Detection</h2>";
    $duplicateStmt = $pdo->prepare("
        SELECT 
            material_id,
            size_specific,
            COUNT(*) as count,
            GROUP_CONCAT(id) as record_ids,
            GROUP_CONCAT(quantity_needed) as quantities
        FROM production_product_materials 
        WHERE product_id = ?
        GROUP BY material_id, size_specific
        HAVING COUNT(*) > 1
    ");
    $duplicateStmt->execute([$product_id]);
    $duplicates = $duplicateStmt->fetchAll();
    
    if ($duplicates) {
        echo "<div style='color: red; font-weight: bold;'>❌ DUPLICATES FOUND:</div>";
        echo "<table>";
        echo "<tr><th>Material ID</th><th>Size Specific</th><th>Count</th><th>Record IDs</th><th>Quantities</th></tr>";
        foreach ($duplicates as $dup) {
            echo "<tr class='duplicate'>";
            echo "<td>{$dup['material_id']}</td>";
            echo "<td>" . ($dup['size_specific'] ?: 'ALL SIZES') . "</td>";
            echo "<td>{$dup['count']}</td>";
            echo "<td>{$dup['record_ids']}</td>";
            echo "<td>{$dup['quantities']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<div style='color: green;'>✅ No duplicates found in product_materials</div>";
    }
    
    // 3. Analyze recent batches for this product
    echo "<h2>📦 3. Recent Batches Analysis</h2>";
    $batchStmt = $pdo->prepare("
        SELECT 
            b.id,
            b.batch_reference,
            b.quantity_to_produce,
            b.sizes_breakdown,
            b.total_materials_cost,
            b.created_at
        FROM production_batches b
        WHERE b.product_id = ?
        ORDER BY b.created_at DESC
        LIMIT 5
    ");
    $batchStmt->execute([$product_id]);
    $batches = $batchStmt->fetchAll();
    
    echo "<table>";
    echo "<tr><th>Batch ID</th><th>Reference</th><th>Qty to Produce</th><th>Sizes Breakdown</th><th>Total Cost</th><th>Created</th></tr>";
    foreach ($batches as $batch) {
        echo "<tr>";
        echo "<td>{$batch['id']}</td>";
        echo "<td>{$batch['batch_reference']}</td>";
        echo "<td>{$batch['quantity_to_produce']}</td>";
        echo "<td>{$batch['sizes_breakdown']}</td>";
        echo "<td>{$batch['total_materials_cost']}</td>";
        echo "<td>{$batch['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 4. Analyze batch_materials for recent batches
    if ($batches) {
        $latest_batch = $batches[0];
        echo "<h2>🧮 4. Batch Materials Analysis for Latest Batch: {$latest_batch['batch_reference']}</h2>";
        
        $batchMaterialsStmt = $pdo->prepare("
            SELECT 
                bm.id,
                bm.material_id,
                m.nom as material_name,
                m.reference as material_ref,
                bm.quantity_used,
                bm.unit_cost,
                bm.total_cost
            FROM production_batch_materials bm
            JOIN production_matieres m ON bm.material_id = m.id
            WHERE bm.batch_id = ?
        ");
        $batchMaterialsStmt->execute([$latest_batch['id']]);
        $batchMaterials = $batchMaterialsStmt->fetchAll();
        
        echo "<table>";
        echo "<tr><th>ID</th><th>Material</th><th>Quantity Used</th><th>Unit Cost</th><th>Total Cost</th></tr>";
        foreach ($batchMaterials as $bm) {
            echo "<tr>";
            echo "<td>{$bm['id']}</td>";
            echo "<td>{$bm['material_name']} ({$bm['material_ref']})</td>";
            echo "<td>{$bm['quantity_used']}</td>";
            echo "<td>{$bm['unit_cost']}</td>";
            echo "<td>{$bm['total_cost']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // 5. Check stock transactions for this batch
        echo "<h2>📈 5. Stock Transactions for Batch: {$latest_batch['batch_reference']}</h2>";
        $transactionStmt = $pdo->prepare("
            SELECT 
                t.id,
                t.material_id,
                m.nom as material_name,
                t.type_mouvement,
                t.quantite,
                t.motif,
                t.date_transaction
            FROM production_transactions_stock t
            JOIN production_matieres m ON t.material_id = m.id
            WHERE t.motif LIKE ?
            ORDER BY t.date_transaction
        ");
        $transactionStmt->execute(['%' . $latest_batch['batch_reference'] . '%']);
        $transactions = $transactionStmt->fetchAll();
        
        echo "<table>";
        echo "<tr><th>Transaction ID</th><th>Material</th><th>Type</th><th>Quantity</th><th>Motif</th><th>Date</th></tr>";
        foreach ($transactions as $trans) {
            $class = $trans['type_mouvement'] === 'out' ? 'warning' : 'normal';
            echo "<tr class='$class'>";
            echo "<td>{$trans['id']}</td>";
            echo "<td>{$trans['material_name']}</td>";
            echo "<td>{$trans['type_mouvement']}</td>";
            echo "<td>{$trans['quantite']}</td>";
            echo "<td>{$trans['motif']}</td>";
            echo "<td>{$trans['date_transaction']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // 6. Simulate the calculation logic
    echo "<h2>🧪 6. Simulation of Material Calculation Logic</h2>";
    
    // Simulate for size 30 only
    $sizes_breakdown = '{"30":1}';
    $sizesData = json_decode($sizes_breakdown, true);
    $totalPlannedPieces = array_sum(array_map('intval', $sizesData));
    
    echo "<p><strong>Test case:</strong> Size 30 only, Quantity: 1</p>";
    echo "<p><strong>Sizes data:</strong> " . json_encode($sizesData) . "</p>";
    echo "<p><strong>Total planned pieces:</strong> $totalPlannedPieces</p>";
    
    $processedKeys = [];
    $simulatedCost = 0;
    
    echo "<table>";
    echo "<tr><th>Material</th><th>Size Config</th><th>Qty Needed</th><th>Planned Pieces</th><th>Total Consumption</th><th>Key</th><th>Status</th></tr>";
    
    foreach ($materials as $mat) {
        $sizeSpecific = $mat['size_specific'] ?? null;
        $key = $mat['material_id'] . '|' . ($sizeSpecific ? $sizeSpecific : 'none');
        
        $status = 'PROCESSED';
        $class = 'normal';
        
        if (isset($processedKeys[$key])) {
            $status = 'DUPLICATE - SKIPPED';
            $class = 'duplicate';
            echo "<tr class='$class'>";
            echo "<td>{$mat['material_name']}</td>";
            echo "<td>" . ($sizeSpecific ?: 'ALL SIZES') . "</td>";
            echo "<td>{$mat['quantity_needed']}</td>";
            echo "<td>-</td>";
            echo "<td>SKIPPED</td>";
            echo "<td>$key</td>";
            echo "<td>$status</td>";
            echo "</tr>";
            continue;
        }
        $processedKeys[$key] = true;
        
        // Calculate planned pieces
        if ($sizeSpecific && $sizeSpecific !== 'none') {
            $plannedPieces = isset($sizesData[$sizeSpecific]) ? (int)$sizesData[$sizeSpecific] : 0;
        } else {
            $plannedPieces = $totalPlannedPieces;
        }
        
        $needed = (float)$mat['quantity_needed'] * $plannedPieces;
        
        echo "<tr class='$class'>";
        echo "<td>{$mat['material_name']}</td>";
        echo "<td>" . ($sizeSpecific ?: 'ALL SIZES') . "</td>";
        echo "<td>{$mat['quantity_needed']}</td>";
        echo "<td>$plannedPieces</td>";
        echo "<td>$needed</td>";
        echo "<td>$key</td>";
        echo "<td>$status</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h2>🎯 7. Conclusion & Recommendations</h2>";
    
    if ($duplicates) {
        echo "<div style='color: red; padding: 10px; border: 1px solid red; background: #ffe6e6;'>";
        echo "<strong>❌ ISSUE IDENTIFIED: Duplicate material configurations</strong><br>";
        echo "The product has duplicate material entries which cause double consumption.<br>";
        echo "<strong>Solution:</strong> Remove duplicate entries from production_product_materials table.";
        echo "</div>";
        
        // Provide cleanup SQL
        echo "<h3>🔧 Cleanup SQL (Run with caution):</h3>";
        echo "<pre style='background: #f5f5f5; padding: 10px; border: 1px solid #ccc;'>";
        foreach ($duplicates as $dup) {
            $ids = explode(',', $dup['record_ids']);
            array_shift($ids); // Keep the first one, remove others
            if ($ids) {
                echo "-- Remove duplicates for material_id {$dup['material_id']}, size {$dup['size_specific']}\n";
                echo "DELETE FROM production_product_materials WHERE id IN (" . implode(',', $ids) . ");\n\n";
            }
        }
        echo "</pre>";
    } else {
        echo "<div style='color: orange; padding: 10px; border: 1px solid orange; background: #fff8e6;'>";
        echo "<strong>⚠️ No duplicates found in product_materials</strong><br>";
        echo "The issue might be in the batch processing logic or multiple transactions being created.<br>";
        echo "Check the stock transactions section above for multiple 'out' transactions for the same batch.";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "<h3 style='color: red;'>❌ Error: " . $e->getMessage() . "</h3>";
    error_log("Error in analyze_material_issue.php: " . $e->getMessage());
}
?>