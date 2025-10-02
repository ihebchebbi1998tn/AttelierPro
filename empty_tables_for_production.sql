-- =====================================================
-- EMPTY TABLES FOR PRODUCTION MODE
-- =====================================================
-- This script empties all tables EXCEPT:
-- - matieres (stock/materials)
-- - matieres_category (material categories)
-- - fournisseurs (suppliers)
-- - quantity_types (quantity types)
-- - utilisateurs (users)
-- - Size configuration tables
-- =====================================================

-- Disable foreign key checks temporarily (MySQL/MariaDB)
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. PRODUCTION BATCHES & RELATED
-- =====================================================

-- Empty batch attachments and images first (child tables)
TRUNCATE TABLE batch_attachments;
TRUNCATE TABLE productions_batches_images;
TRUNCATE TABLE production_batch_notes;
TRUNCATE TABLE batch_status_history;
TRUNCATE TABLE production_batch_materials;

-- Empty main production batches table
TRUNCATE TABLE production_batches;

-- =====================================================
-- 2. REGULAR PRODUCTS (Lucci/Spada)
-- =====================================================

-- Empty product-related child tables first
TRUNCATE TABLE product_attachments;
TRUNCATE TABLE product_measurements;
TRUNCATE TABLE product_measurements_by_size;
TRUNCATE TABLE product_size_history;
TRUNCATE TABLE produit_matieres;

-- Empty main products tables
TRUNCATE TABLE produits;
TRUNCATE TABLE products_lucci;
TRUNCATE TABLE products_spada;

-- Empty external products
TRUNCATE TABLE produits_externes;

-- =====================================================
-- 3. SUR MESURE ORDERS
-- =====================================================

-- Empty sur mesure child tables first
TRUNCATE TABLE surmesure_matieres;
TRUNCATE TABLE commandes_surmesure_images;
TRUNCATE TABLE commandes_surmesure_videos;
TRUNCATE TABLE commandes_surmesure_commentaires;
TRUNCATE TABLE commandes_mesures;
TRUNCATE TABLE commandes_fichiers;

-- Empty main sur mesure orders table
TRUNCATE TABLE commandes_surmesure;

-- =====================================================
-- 4. SOUSTRAITANCE (SUBCONTRACTING)
-- =====================================================

-- Empty soustraitance child tables first
TRUNCATE TABLE soustraitance_stock_history;
TRUNCATE TABLE soustraitance_stock;
TRUNCATE TABLE soustraitance_product_materials;
TRUNCATE TABLE soustraitance_products_files;
TRUNCATE TABLE soustraitance_client_files;
TRUNCATE TABLE production_soustraitance_batches;

-- Empty main soustraitance tables
TRUNCATE TABLE soustraitance_products;
TRUNCATE TABLE soustraitance_clients;

-- =====================================================
-- 5. EXTERNAL CLIENTS
-- =====================================================

TRUNCATE TABLE clients_externes;

-- =====================================================
-- 6. STOCK TRANSACTIONS (OPTIONAL - UNCOMMENT TO EMPTY)
-- =====================================================

-- Uncomment the line below if you want to empty stock transaction history
-- TRUNCATE TABLE stock_transactions;

-- =====================================================
-- 7. SPECIFICATION TEMPLATES (OPTIONAL - UNCOMMENT TO EMPTY)
-- =====================================================

-- Uncomment the line below if you want to empty specification templates
-- TRUNCATE TABLE specification_templates;

-- =====================================================
-- 8. MEASUREMENT SCALES (OPTIONAL - UNCOMMENT TO EMPTY)
-- =====================================================

-- Uncomment the line below if you want to empty measurement scales
-- TRUNCATE TABLE measurement_scales;

-- =====================================================
-- 9. RH (HUMAN RESOURCES) - OPTIONAL
-- =====================================================

-- Uncomment these lines if you want to empty HR data
-- TRUNCATE TABLE rh_time_entries;
-- TRUNCATE TABLE rh_holidays;
-- TRUNCATE TABLE rh_salaries;
-- TRUNCATE TABLE rh_shift_templates;
-- TRUNCATE TABLE rh_schedules;
-- TRUNCATE TABLE rh_employees;

-- =====================================================
-- Re-enable foreign key checks
-- =====================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the tables are empty:

-- SELECT COUNT(*) as production_batches_count FROM production_batches;
-- SELECT COUNT(*) as produits_count FROM produits;
-- SELECT COUNT(*) as commandes_surmesure_count FROM commandes_surmesure;
-- SELECT COUNT(*) as soustraitance_products_count FROM soustraitance_products;

-- Verify preserved tables still have data:
-- SELECT COUNT(*) as matieres_count FROM matieres;
-- SELECT COUNT(*) as utilisateurs_count FROM utilisateurs;
-- SELECT COUNT(*) as matieres_category_count FROM matieres_category;
-- SELECT COUNT(*) as quantity_types_count FROM quantity_types;
