-- Additional inventory insert script for production_matieres table
-- New materials batch 430-443 series (Spada materials)
-- Based on table structure: id, nom, reference, description, category_id, quantity_type_id, quantite_stock, quantite_min, quantite_max, prix_unitaire, location, couleur, taille, laize, fournisseur, id_fournisseur, date_achat, date_expiration, image_url, active, created_at, updated_at, other_attributes, materiere_type, extern_customer_id

INSERT INTO `production_matieres` (
    `nom`, 
    `reference`, 
    `description`, 
    `category_id`, 
    `quantity_type_id`, 
    `quantite_stock`, 
    `quantite_min`, 
    `quantite_max`, 
    `prix_unitaire`, 
    `location`, 
    `couleur`, 
    `taille`, 
    `laize`,
    `fournisseur`, 
    `id_fournisseur`, 
    `date_achat`, 
    `date_expiration`, 
    `image_url`, 
    `active`, 
    `created_at`,
    `updated_at`,
    `other_attributes`, 
    `materiere_type`, 
    `extern_customer_id`
) VALUES
-- New Spada materials batch 430-443
('430', '430', 'Tissue', 1, 1, 53.50, 10.000, 30.000, 0.00, 'Spada', 'prince de galle', NULL, '0.75', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('431', '431', 'Tissue', 1, 1, 56.70, 10.000, 30.000, 0.00, 'Spada', 'gris fil a fil', NULL, '0.75', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('432', '432', 'Tissue', 1, 1, 20.00, 10.000, 30.000, 0.00, 'Spada', 'blanc', NULL, '1.47', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('433', '433', 'Tissue', 1, 1, 35.00, 10.000, 30.000, 0.00, 'Spada', 'creme', NULL, '1.5', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('434', '434', 'Tissue', 1, 1, 50.00, 10.000, 30.000, 0.00, 'Spada', 'creme rye', NULL, '1.58', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('435', '435', 'Tissue', 1, 1, 10.00, 10.000, 30.000, 0.00, 'Spada', 'bleu marine', NULL, '1.5', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('436', '436', 'Tissue', 1, 1, 10.00, 10.000, 30.000, 0.00, 'Spada', 'bleu petrol 1', NULL, '1.5', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('437', '437', 'Tissue', 1, 1, 12.00, 10.000, 30.000, 0.00, 'Spada', 'bleu ciel fil a fil', NULL, '1.5', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('438', '438', 'Tissue', 1, 1, 36.00, 10.000, 30.000, 0.00, 'Spada', 'bleu petrol 2', NULL, '1.49', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('439', '439', 'Tissue', 1, 1, 96.75, 10.000, 30.000, 0.00, 'Spada', 'bleu petrol 3', NULL, '1.49', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('440', '440', 'Tissue', 1, 1, 36.00, 10.000, 30.000, 0.00, 'Spada', 'bleu petrol', NULL, '1.49', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('441', '441', 'Tissue', 1, 1, 90.00, 10.000, 30.000, 0.00, 'Spada', 'noir', NULL, '1.5', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('442', '442', 'Tissue', 1, 1, 4.00, 10.000, 30.000, 0.00, 'Spada', 'gris prince d galle', NULL, '1.49', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('443', '443', 'Tissue', 1, 1, 18.30, 10.000, 30.000, 0.00, 'Spada', 'creme', NULL, '1.5', 'Spada', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL);

-- Summary of inserted materials:
-- Total: 14 new Spada materials (series 430-443)
-- All materials are set as:
-- - category_id: 1 (Tissus)
-- - quantity_type_id: 1 (meters)
-- - location: 'Spada'
-- - materiere_type: 'intern' (internal materials)
-- - quantite_min: 10.000
-- - quantite_max: 30.000
-- - prix_unitaire: 0.00 (to be updated later)
-- - active: 1 (active)
-- - fournisseur: 'Spada'
-- - Combined quantities calculated: 431 (49.7+7=56.7), 439 (77+19.75=96.75)
