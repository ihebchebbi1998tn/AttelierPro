-- Additional inventory insert script for production_matieres table
-- New materials batch 301-400 series
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
-- New materials batch 301-400
('301', 'beige', 'Tissue importé', 1, 1, 44.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'beige', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('302', 'bleu petr', 'Tissue importé', 1, 1, 35.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu petr', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('303', 'gris fac', 'Tissue importé', 1, 1, 9.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'gris fac', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('304', 'noir endroit', 'Tissue importé', 1, 1, 17.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir endroit', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('305', 'vert', 'Tissue importé', 1, 1, 42.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'vert', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('306', 'vert milita', 'Tissue importé', 1, 1, 15.38, 10.000, 30.000, 0.00, 'Lucci By Ey', 'vert milita', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('314', 'gris chauv', 'Tissue importé', 1, 1, 9.75, 10.000, 30.000, 0.00, 'Lucci By Ey', 'gris chauv', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('315', 'gris cash', 'Tissue importé', 1, 1, 37.40, 10.000, 30.000, 0.00, 'Lucci By Ey', 'gris cash', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('316', 'bleu mari', 'Tissue importé', 1, 1, 24.80, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu mari', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('317', 'motarde', 'Tissue importé', 1, 1, 7.65, 10.000, 30.000, 0.00, 'Lucci By Ey', 'motarde', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('318', 'gris', 'Tissue importé', 1, 1, 14.75, 10.000, 30.000, 0.00, 'Lucci By Ey', 'gris', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('319', 'noir', 'Tissue importé', 1, 1, 15.50, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('320', 'noir', '1.5', 1, 1, 5.60, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('328', 'maron chauvr', 'Tissue importé', 1, 1, 30.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'maron chauvr', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('329', 'vert mili', 'Tissue importé', 1, 1, 50.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'vert mili', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('330', 'bleu mar', 'Tissue importé', 1, 1, 26.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu mar', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('331', 'noir', 'Tissue importé', 1, 1, 53.90, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir', NULL, '1.48', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('332', 'bleu marin', 'Tissue importé', 1, 1, 45.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu marin', NULL, '1.49', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('333', 'bleu main lin', 'Tissue importé', 1, 1, 24.70, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu main lin', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('334', 'noir cashmi', 'Tissue importé', 1, 1, 85.60, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir cashmi', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('342', 'vert', 'Tissue importé', 1, 1, 13.65, 10.000, 30.000, 0.00, 'Lucci By Ey', 'vert', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('343', 'grege', 'Tissue importé', 1, 1, 10.75, 10.000, 30.000, 0.00, 'Lucci By Ey', 'grege', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('344', 'bleu nuit cashm', 'Tissue importé', 1, 1, 19.20, 10.000, 30.000, 0.00, 'Lucci By Ey', 'bleu nuit cashm', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('345', 'rose clair', 'Tissue importé', 1, 1, 5.50, 10.000, 30.000, 0.00, 'Lucci By Ey', 'rose clair', NULL, '0.77', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('346', 'rose fonc', 'Tissue importé', 1, 1, 100.00, 10.000, 30.000, 0.00, 'Lucci By Ey', 'rose fonc', NULL, '1.47', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('400', 'noir', 'Tissue importé', 1, 1, 23.20, 10.000, 30.000, 0.00, 'Lucci By Ey', 'noir', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),
('401', 'gris carreau cashmi', 'Tissue importé', 1, 1, 17.30, 10.000, 30.000, 0.00, 'Lucci By Ey', 'gris carreau cashmi', NULL, '1.5', 'Lucci', NULL, NOW(), NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL);

-- Summary of inserted materials:
-- Total: 26 new materials (series 301-401)
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