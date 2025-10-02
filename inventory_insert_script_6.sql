-- ============================================
-- Inventory Insert Script 6 - Les Deux Materials
-- Insert 26 doublure materials (References 1-26)
-- ============================================

INSERT INTO `production_matieres` (
    `nom`, `reference`, `description`, `category_id`, `quantity_type_id`,
    `quantite_stock`, `quantite_min`, `quantite_max`, `prix_unitaire`,
    `location`, `couleur`, `taille`, `laize`, `fournisseur`, `id_fournisseur`,
    `date_achat`, `date_expiration`, `image_url`, `active`,
    `created_at`, `updated_at`, `other_attributes`, `materiere_type`, `extern_customer_id`
) VALUES
-- Reference 1: 1 doublure
('1 doublure', '1', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'Les Deux', 'jaune', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 2: 2 doublure
('2 doublure', '2', 'Tissue', 1, 1, 3.000, 10.000, 30.000, 0.00, 'Les Deux', 'bordeau motif', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 3: 3 doublure
('3 doublure', '3', 'Tissue', 1, 1, 5.000, 10.000, 30.000, 0.00, 'Les Deux', 'bordeau rye', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 4: 4 doublure
('4 doublure', '4', 'Tissue', 1, 1, 7.000, 10.000, 30.000, 0.00, 'Les Deux', 'noir', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 5: 5 doublure
('5 doublure', '5', 'Tissue', 1, 1, 208.000, 10.000, 30.000, 0.00, 'Les Deux', 'beige rye', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 6: 6 doublure
('6 doublure', '6', 'Tissue', 1, 1, 350.000, 10.000, 30.000, 0.00, 'Les Deux', 'millionette', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 7: 7 doublure
('7 doublure', '7', 'Tissue', 1, 1, 72.000, 10.000, 30.000, 0.00, 'Les Deux', 'bleu mar rye', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 8: 8 doublure
('8 doublure', '8', 'Tissue', 1, 1, 7.000, 10.000, 30.000, 0.00, 'Les Deux', 'beige motif vert', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 9: 9 doublure
('9 doublure', '9', 'Tissue', 1, 1, 11.000, 10.000, 30.000, 0.00, 'Les Deux', 'vert gazon', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 10: 10 doublure
('10 doublure', '10', 'Tissue', 1, 1, 35.000, 10.000, 30.000, 0.00, 'Les Deux', 'bleu nuit motif', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 11: 11 doublure
('11 doublure', '11', 'Tissue', 1, 1, 10.000, 10.000, 30.000, 0.00, 'Les Deux', 'mauve fonce motif', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 12: 12 doublure
('12 doublure', '12', 'Tissue', 1, 1, 15.000, 10.000, 30.000, 0.00, 'Les Deux', 'marron', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 13: 13 doublure
('13 doublure', '13', 'Tissue', 1, 1, 200.000, 10.000, 30.000, 0.00, 'Les Deux', 'noir rye blanc', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 14: 14 doublure
('14 doublure', '14', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'Les Deux', 'bleu rye', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 15: 15 doublure
('15 doublure', '15', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'Les Deux', 'cashmir dore', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 16: 16 doublure
('16 doublure', '16', 'Tissue', 1, 1, 80.000, 10.000, 30.000, 0.00, 'Les Deux', 'mauve', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 17: 17 doublure
('17 doublure', '17', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'Les Deux', 'blanc', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 18: 18 doublure
('18 doublure', '18', 'Tissue', 1, 1, 50.000, 10.000, 30.000, 0.00, 'Les Deux', 'bleu ciel', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 19: 19 doublure
('19 doublure', '19', 'Tissue', 1, 1, 1.700, 10.000, 30.000, 0.00, 'Les Deux', 'vert militaire', NULL, '1.5', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 20: 20 doublure
('20 doublure', '20', 'Tissue', 1, 1, 120.000, 10.000, 30.000, 0.00, 'Les Deux', 'vert rye tps sur ps', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 21: 21 doublure
('21 doublure', '21', 'Tissue', 1, 1, 21.000, 10.000, 30.000, 0.00, 'Les Deux', 'mauve rye', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 22: 22 doublure
('22 doublure', '22', 'Tissue', 1, 1, 40.000, 10.000, 30.000, 0.00, 'Les Deux', 'bleu gris', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 23: 23 doublure
('23 doublure', '23', 'Tissue', 1, 1, 15.000, 10.000, 30.000, 0.00, 'Les Deux', 'mauve', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 24: 24 doublure
('24 doublure', '24', 'Tissue', 1, 1, 26.000, 10.000, 30.000, 0.00, 'Les Deux', 'mauve rye tps sur tps', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 25: 25 doublure
('25 doublure', '25', 'Tissue', 1, 1, 30.000, 10.000, 30.000, 0.00, 'Les Deux', 'noir rye beige', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 26: 26 doublure
('26 doublure', '26', 'Tissue', 1, 1, 50.000, 10.000, 30.000, 0.00, 'Les Deux', 'rougr brique', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL);

-- ============================================
-- Summary:
-- ✅ Inserted 26 doublure materials (References 1-26)
-- ✅ Location: Les Deux
-- ✅ Default values:
--    - category_id: 1
--    - quantity_type_id: 1
--    - quantite_min: 10.000
--    - quantite_max: 30.000
--    - prix_unitaire: 0.00
--    - active: 1
--    - fournisseur: Les Deux
--    - materiere_type: intern
-- ============================================
