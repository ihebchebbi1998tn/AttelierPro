-- Additional inventory insert script for production_matieres table
-- New materials batch 407-425 series (chemise materials)
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
-- New chemise materials batch 407-425
('407 chemise', '407', 'Tissue chemise', 1, 1, 56.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'blanc rouge bleu', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('408 chemise', '408', 'Tissue chemise', 1, 1, 37.30, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir blanc rye', NULL, '0.75', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('409 chemise', '409', 'Tissue chemise', 1, 1, 43.80, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu ciel', NULL, '0.74', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('410 chemise', '410', 'Tissue chemise', 1, 1, 19.75, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu blanc rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('411 chemise', '411', 'Tissue chemise', 1, 1, 15.10, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('412 chemise', '412', 'Tissue chemise', 1, 1, 10.60, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu blanc rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('413 chemise', '413', 'Tissue chemise', 1, 1, 29.45, 10.000, 30.000, 0.00, 'Lucci By Ey', 'beige blanc rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('414 chemise', '414', 'Tissue chemise', 1, 1, 12.20, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir blanc rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('415 chemise', '415', 'Tissue chemise', 1, 1, 22.60, 10.000, 30.000, 0.00, 'Lucci By Ey', 'rose rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('416 chemise', '416', 'Tissue chemise', 1, 1, 5.30, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu ciel', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('417 chemise', '417', 'Tissue chemise', 1, 1, 7.65, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu blanc rye', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('418 chemise', '418', 'Tissue chemise', 1, 1, 9.65, 10.000, 30.000, 0.00, 'Lucci By Ey', 'blanc motif rouge', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('419 chemise', '419', 'Tissue chemise', 1, 1, 5.20, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu ciel', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('420 chemise', '420', 'Tissue chemise', 1, 1, 12.70, 10.000, 30.000, 0.00, 'Lucci By Ey', 'grege ptit carrea', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('421 chemise', '421', 'Tissue chemise', 1, 1, 6.10, 10.000, 30.000, 0.00, 'Lucci By Ey', 'beige ptt carrea', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('422 chemise', '422', 'Tissue chemise', 1, 1, 39.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'blanc', NULL, NULL, 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('423 chemise', '423', 'Tissue chemise', 1, 1, 21.80, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu ciel rye', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('424 chemise', '424', 'Tissue chemise', 1, 1, 9.70, 10.000, 30.000, 0.00, 'Lucci By Ey', 'blanc carreau', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('425 chemise', '425', 'Tissue chemise', 1, 1, 6.10, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu petro', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL);

-- Summary of inserted materials:
-- Total: 19 new chemise materials (series 407-425)
-- All materials are set as:
-- - category_id: 1 (Tissus)
-- - quantity_type_id: 1 (meters)
-- - location: 'Lucci By Ey'
-- - materiere_type: 'intern' (internal materials)
-- - quantite_min: 10.000
-- - quantite_max: 30.000
-- - prix_unitaire: 0.00 (to be updated later)
-- - active: 1 (active)
-- - fournisseur: 'Lucci'
-- - Combined quantities calculated: 409 (23.6+20.2=43.8), 413 (19.7+9.75=29.45)
-- - Empty laize fields preserved as NULL for items 416-422