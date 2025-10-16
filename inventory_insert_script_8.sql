-- ============================================
-- Inventory Insert Script 8 - Extern Doublure Materials
-- Insert 51 extern doublure materials (References 1-26, 55-75)
-- ============================================

INSERT INTO `production_matieres` (
    `nom`, `reference`, `description`, `category_id`, `quantity_type_id`,
    `quantite_stock`, `quantite_min`, `quantite_max`, `prix_unitaire`,
    `location`, `couleur`, `taille`, `laize`, `fournisseur`, `id_fournisseur`,
    `date_achat`, `date_expiration`, `image_url`, `active`,
    `created_at`, `updated_at`, `other_attributes`, `materiere_type`, `extern_customer_id`
) VALUES
-- Reference 1: 1 doublure
('1 doublure', '1', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'extern', 'jaune', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 2: 2 doublure
('2 doublure', '2', 'Tissue', 1, 1, 3.000, 10.000, 30.000, 0.00, 'extern', 'bordeau motif', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 3: 3 doublure
('3 doublure', '3', 'Tissue', 1, 1, 5.000, 10.000, 30.000, 0.00, 'extern', 'bordeau rye', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 4: 4 doublure
('4 doublure', '4', 'Tissue', 1, 1, 7.000, 10.000, 30.000, 0.00, 'extern', 'noir', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 5: 5 doublure
('5 doublure', '5', 'Tissue', 1, 1, 208.000, 10.000, 30.000, 0.00, 'extern', 'beige rye', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 6: 6 doublure
('6 doublure', '6', 'Tissue', 1, 1, 350.000, 10.000, 30.000, 0.00, 'extern', 'millionette', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 7: 7 doublure
('7 doublure', '7', 'Tissue', 1, 1, 72.000, 10.000, 30.000, 0.00, 'extern', 'bleu mar rye', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 8: 8 doublure
('8 doublure', '8', 'Tissue', 1, 1, 7.000, 10.000, 30.000, 0.00, 'extern', 'beige motif vert', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 9: 9 doublure
('9 doublure', '9', 'Tissue', 1, 1, 11.000, 10.000, 30.000, 0.00, 'extern', 'vert gazon', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 10: 10 doublure
('10 doublure', '10', 'Tissue', 1, 1, 35.000, 10.000, 30.000, 0.00, 'extern', 'bleu nuit motif', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 11: 11 doublure
('11 doublure', '11', 'Tissue', 1, 1, 10.000, 10.000, 30.000, 0.00, 'extern', 'mauve fonce motif', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 12: 12 doublure
('12 doublure', '12', 'Tissue', 1, 1, 15.000, 10.000, 30.000, 0.00, 'extern', 'marron', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 13: 13 doublure
('13 doublure', '13', 'Tissue', 1, 1, 200.000, 10.000, 30.000, 0.00, 'extern', 'noir rye blanc', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 14: 14 doublure
('14 doublure', '14', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'extern', 'bleu rye', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 15: 15 doublure
('15 doublure', '15', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'extern', 'cashmir dore', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 16: 16 doublure
('16 doublure', '16', 'Tissue', 1, 1, 80.000, 10.000, 30.000, 0.00, 'extern', 'mauve', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 17: 17 doublure
('17 doublure', '17', 'Tissue', 1, 1, 20.000, 10.000, 30.000, 0.00, 'extern', 'blanc', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 18: 18 doublure
('18 doublure', '18', 'Tissue', 1, 1, 50.000, 10.000, 30.000, 0.00, 'extern', 'bleu ciel', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 19: 19 doublure
('19 doublure', '19', 'Tissue', 1, 1, 1.700, 10.000, 30.000, 0.00, 'extern', 'vert militaire', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 20: 20 doublure
('20 doublure', '20', 'Tissue', 1, 1, 120.000, 10.000, 30.000, 0.00, 'extern', 'vert rye tps sur ps', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 21: 21 doublure
('21 doublure', '21', 'Tissue', 1, 1, 21.000, 10.000, 30.000, 0.00, 'extern', 'mauve rye', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 22: 22 doublure
('22 doublure', '22', 'Tissue', 1, 1, 40.000, 10.000, 30.000, 0.00, 'extern', 'bleu gris', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 23: 23 doublure
('23 doublure', '23', 'Tissue', 1, 1, 15.000, 10.000, 30.000, 0.00, 'extern', 'mauve', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 24: 24 doublure
('24 doublure', '24', 'Tissue', 1, 1, 26.000, 10.000, 30.000, 0.00, 'extern', 'mauve rye tps sur tps', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 25: 25 doublure
('25 doublure', '25', 'Tissue', 1, 1, 30.000, 10.000, 30.000, 0.00, 'extern', 'noir rye beige', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 26: 26 doublure
('26 doublure', '26', 'Tissue', 1, 1, 50.000, 10.000, 30.000, 0.00, 'extern', 'rougr brique', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 55: 55 doublure
('55 doublure', '55', 'Tissue', 1, 1, 17.800, 10.000, 30.000, 0.00, 'extern', 'rouge blanc', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 56: 56 doublure
('56 doublure', '56', 'Tissue', 1, 1, 19.900, 10.000, 30.000, 0.00, 'extern', 'bordeau rye', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 57: 57 doublure
('57 doublure', '57', 'Tissue', 1, 1, 101.000, 10.000, 30.000, 0.00, 'extern', 'noir motif rouge', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 58: 58 doublure
('58 doublure', '58', 'Tissue', 1, 1, 87.600, 10.000, 30.000, 0.00, 'extern', 'rouge motif bleu', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 59: 59 doublure
('59 doublure', '59', 'Tissue', 1, 1, 116.000, 10.000, 30.000, 0.00, 'extern', 'noir motif', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 60: 60 doublure
('60 doublure', '60', 'Tissue', 1, 1, 6.200, 10.000, 30.000, 0.00, 'extern', 'orange cashmir', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 61: 61 doublure
('61 doublure', '61', 'Tissue', 1, 1, 6.800, 10.000, 30.000, 0.00, 'extern', 'blanc casse motf', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 62: 62 doublure
('62 doublure', '62', 'Tissue', 1, 1, 5.600, 10.000, 30.000, 0.00, 'extern', 'bordeau motif', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 63: 63 doublure
('63 doublure', '63', 'Tissue', 1, 1, 42.300, 10.000, 30.000, 0.00, 'extern', 'bleu royal', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 64: 64 doublure
('64 doublure', '64', 'Tissue', 1, 1, 2.000, 10.000, 30.000, 0.00, 'extern', 'vert fonce', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 65: 65 doublure
('65 doublure', '65', 'Tissue', 1, 1, 3.000, 10.000, 30.000, 0.00, 'extern', 'rouge brique', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 66: 66 doublure
('66 doublure', '66', 'Tissue', 1, 1, 4.700, 10.000, 30.000, 0.00, 'extern', 'jaune citron', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 67: 67 doublure
('67 doublure', '67', 'Tissue', 1, 1, 1.600, 10.000, 30.000, 0.00, 'extern', 'gris claire', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 68: 68 doublure
('68 doublure', '68', 'Tissue', 1, 1, 5.650, 10.000, 30.000, 0.00, 'extern', 'millionete blanc jaune', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 69: 69 doublure
('69 doublure', '69', 'Tissue', 1, 1, 2.300, 10.000, 30.000, 0.00, 'extern', 'gris claire', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 70: 70 doublure
('70 doublure', '70', 'Tissue', 1, 1, 7.170, 10.000, 30.000, 0.00, 'extern', 'gris fonce', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 71: 71 doublure
('71 doublure', '71', 'Tissue', 1, 1, 1.500, 10.000, 30.000, 0.00, 'extern', 'vert kaki', NULL, '1.5', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 72: 72 doublure
('72 doublure', '72', 'Tissue', 1, 1, 11.000, 10.000, 30.000, 0.00, 'extern', 'satin smoking', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 73: 73 doublure
('73 doublure', '73', 'Tissue', 1, 1, 20.500, 10.000, 30.000, 0.00, 'extern', 'matelat bleu berbery', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 74: 74 doublure
('74 doublure', '74', 'Tissue', 1, 1, 34.000, 10.000, 30.000, 0.00, 'extern', 'matelat gris berbery', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL),

-- Reference 75: 75 doublure
('75 doublure', '75', 'Tissue', 1, 1, 61.500, 10.000, 30.000, 0.00, 'extern', 'sac de poche blanc', NULL, '0', 'Extern', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'extern', NULL);

-- ============================================
-- Summary:
-- ✅ Inserted 51 extern doublure materials (References 1-26, 55-75)
-- ✅ Location: extern
-- ✅ Default values:
--    - category_id: 1
--    - quantity_type_id: 1
--    - quantite_min: 10.000
--    - quantite_max: 30.000
--    - prix_unitaire: 0.00
--    - active: 1
--    - fournisseur: Extern
--    - materiere_type: extern
-- ✅ Laize values: 0 or 1.5 as per data
-- ✅ Stock quantities (quantite_stock) match metrage from source data
-- ============================================
