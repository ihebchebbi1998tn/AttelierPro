-- ============================================
-- Inventory Insert Script 7 - Les Deux Materials
-- Insert 21 doublure materials (References 55-75)
-- ============================================

INSERT INTO `production_matieres` (
    `nom`, `reference`, `description`, `category_id`, `quantity_type_id`,
    `quantite_stock`, `quantite_min`, `quantite_max`, `prix_unitaire`,
    `location`, `couleur`, `taille`, `laize`, `fournisseur`, `id_fournisseur`,
    `date_achat`, `date_expiration`, `image_url`, `active`,
    `created_at`, `updated_at`, `other_attributes`, `materiere_type`, `extern_customer_id`
) VALUES
-- Reference 55: 55 doublure
('55 doublure', '55', 'Tissue', 1, 1, 17.800, 10.000, 30.000, 0.00, 'Les Deux', 'rouge blanc', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 56: 56 doublure
('56 doublure', '56', 'Tissue', 1, 1, 19.900, 10.000, 30.000, 0.00, 'Les Deux', 'bordeau rye', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 57: 57 doublure
('57 doublure', '57', 'Tissue', 1, 1, 101.000, 10.000, 30.000, 0.00, 'Les Deux', 'noir motif rouge', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 58: 58 doublure
('58 doublure', '58', 'Tissue', 1, 1, 87.600, 10.000, 30.000, 0.00, 'Les Deux', 'rouge motif bleu', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 59: 59 doublure
('59 doublure', '59', 'Tissue', 1, 1, 116.000, 10.000, 30.000, 0.00, 'Les Deux', 'noir motif', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 60: 60 doublure
('60 doublure', '60', 'Tissue', 1, 1, 6.200, 10.000, 30.000, 0.00, 'Les Deux', 'orange cashmir', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 61: 61 doublure
('61 doublure', '61', 'Tissue', 1, 1, 6.800, 10.000, 30.000, 0.00, 'Les Deux', 'blanc casse motf', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 62: 62 doublure
('62 doublure', '62', 'Tissue', 1, 1, 5.600, 10.000, 30.000, 0.00, 'Les Deux', 'bordeau motif', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 63: 63 doublure
('63 doublure', '63', 'Tissue', 1, 1, 42.300, 10.000, 30.000, 0.00, 'Les Deux', 'bleu royal', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 64: 64 doublure
('64 doublure', '64', 'Tissue', 1, 1, 2.000, 10.000, 30.000, 0.00, 'Les Deux', 'vert fonce', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 65: 65 doublure
('65 doublure', '65', 'Tissue', 1, 1, 3.000, 10.000, 30.000, 0.00, 'Les Deux', 'rouge brique', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 66: 66 doublure
('66 doublure', '66', 'Tissue', 1, 1, 4.700, 10.000, 30.000, 0.00, 'Les Deux', 'jaune citron', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 67: 67 doublure
('67 doublure', '67', 'Tissue', 1, 1, 1.600, 10.000, 30.000, 0.00, 'Les Deux', 'gris claire', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 68: 68 doublure
('68 doublure', '68', 'Tissue', 1, 1, 5.650, 10.000, 30.000, 0.00, 'Les Deux', 'millionete blanc jaune', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 69: 69 doublure
('69 doublure', '69', 'Tissue', 1, 1, 2.300, 10.000, 30.000, 0.00, 'Les Deux', 'gris claire', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 70: 70 doublure
('70 doublure', '70', 'Tissue', 1, 1, 7.170, 10.000, 30.000, 0.00, 'Les Deux', 'gris fonce', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 71: 71 doublure
('71 doublure', '71', 'Tissue', 1, 1, 1.500, 10.000, 30.000, 0.00, 'Les Deux', 'vert kaki', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 72: 72 doublure
('72 doublure', '72', 'Tissue', 1, 1, 11.000, 10.000, 30.000, 0.00, 'Les Deux', 'satin smoking', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 73: 73 doublure
('73 doublure', '73', 'Tissue', 1, 1, 20.500, 10.000, 30.000, 0.00, 'Les Deux', 'matelat bleu berbery', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 74: 74 doublure
('74 doublure', '74', 'Tissue', 1, 1, 34.000, 10.000, 30.000, 0.00, 'Les Deux', 'matelat gris berbery', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL),

-- Reference 75: 75 doublure
('75 doublure', '75', 'Tissue', 1, 1, 61.500, 10.000, 30.000, 0.00, 'Les Deux', 'sac de poche blanc', NULL, '0', 'Les Deux', NULL, NULL, NULL, NULL, 1, NOW(), NOW(), NULL, 'intern', NULL);

-- ============================================
-- Summary:
-- ✅ Inserted 21 doublure materials (References 55-75)
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
