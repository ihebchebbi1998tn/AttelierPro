-- ========================================================
-- Script SQL complet pour le système de production textile
-- Inclut: gestion boutiques, synchronisation, production, stock
-- ========================================================

-- ===== SUPPRESSION DES TABLES EXISTANTES =====
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS production_commandes_fichiers;
DROP TABLE IF EXISTS production_produits_externes;
DROP TABLE IF EXISTS production_clients_externes;
DROP TABLE IF EXISTS production_videos;
DROP TABLE IF EXISTS production_images;
DROP TABLE IF EXISTS production_commandes_mesures;
DROP TABLE IF EXISTS production_commandes_surmesure;
DROP TABLE IF EXISTS production_clients;
DROP TABLE IF EXISTS production_produit_matieres;
DROP TABLE IF EXISTS production_produits;
DROP TABLE IF EXISTS production_batch_materials;
DROP TABLE IF EXISTS production_batches;
DROP TABLE IF EXISTS production_product_materials;
DROP TABLE IF EXISTS production_sync_log;
DROP TABLE IF EXISTS production_ready_products;
DROP TABLE IF EXISTS production_transactions_stock;
DROP TABLE IF EXISTS production_matieres;
DROP TABLE IF EXISTS production_matieres_category;
DROP TABLE IF EXISTS production_quantity_types;
DROP TABLE IF EXISTS production_utilisateurs;

SET FOREIGN_KEY_CHECKS = 1;

-- ===== CRÉATION DES TABLES =====

-- 1️⃣ Table utilisateurs
CREATE TABLE IF NOT EXISTS `production_utilisateurs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','production_manager','operator') DEFAULT 'operator',
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2️⃣ Table types de quantité
CREATE TABLE IF NOT EXISTS `production_quantity_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL,
  `unite` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3️⃣ Table catégories de matériaux
CREATE TABLE IF NOT EXISTS `production_matieres_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#6B7280',
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4️⃣ Table matériaux
CREATE TABLE IF NOT EXISTS `production_matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `quantity_type_id` int(11) NOT NULL,
  `quantite_stock` decimal(10,3) DEFAULT 0,
  `quantite_min` decimal(10,3) DEFAULT 0,
  `quantite_max` decimal(10,3) DEFAULT 0,
  `prix_unitaire` decimal(10,2) DEFAULT 0,
  `location` varchar(255) DEFAULT NULL,
  `couleur` varchar(50) DEFAULT NULL,
  `taille` varchar(50) DEFAULT NULL,
  `fournisseur` varchar(255) DEFAULT NULL,
  `date_achat` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `production_matieres_category` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  INDEX `idx_category` (`category_id`),
  INDEX `idx_nom` (`nom`),
  INDEX `idx_reference` (`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5️⃣ Table transactions de stock
CREATE TABLE IF NOT EXISTS `production_transactions_stock` (
  `transaction_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `material_id` int(11) NOT NULL,
  `type_mouvement` enum('in','out','adjustment') NOT NULL,
  `quantite` decimal(10,3) NOT NULL,
  `quantity_type_id` int(11) NOT NULL,
  `prix_unitaire` decimal(10,2) DEFAULT 0,
  `cout_total` decimal(12,2) DEFAULT 0,
  `motif` varchar(255) DEFAULT NULL,
  `reference_commande` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `date_transaction` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `production_utilisateurs` (`id`) ON DELETE SET NULL,
  INDEX `idx_material_id` (`material_id`),
  INDEX `idx_type_mouvement` (`type_mouvement`),
  INDEX `idx_date_transaction` (`date_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6️⃣ Table produits prêts pour la production (synchronisés depuis les boutiques)
CREATE TABLE IF NOT EXISTS `production_ready_products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `boutique_origin` enum('luccibyey','spadadibattaglia') NOT NULL,
  `external_product_id` varchar(50) NOT NULL,
  `reference_product` varchar(255) NOT NULL,
  `nom_product` varchar(255) NOT NULL,
  `img_product` varchar(500) DEFAULT NULL,
  `img2_product` varchar(500) DEFAULT NULL,
  `img3_product` varchar(500) DEFAULT NULL,
  `img4_product` varchar(500) DEFAULT NULL,
  `img5_product` varchar(500) DEFAULT NULL,
  `description_product` text DEFAULT NULL,
  `type_product` varchar(100) DEFAULT NULL,
  `category_product` varchar(100) DEFAULT NULL,
  `itemgroup_product` varchar(100) DEFAULT NULL,
  `price_product` decimal(10,2) DEFAULT NULL,
  `qnty_product` int(11) DEFAULT 0,
  `color_product` varchar(100) DEFAULT NULL,
  `collection_product` varchar(255) DEFAULT NULL,
  `status_product` enum('active','inactive') DEFAULT 'active',
  `auto_replenishment` tinyint(1) DEFAULT 0,
  `auto_replenishment_quantity` int(11) DEFAULT 0,
  `auto_replenishment_quantity_sizes` text DEFAULT NULL,
  `sizes_data` text DEFAULT NULL,
  `discount_product` decimal(10,2) DEFAULT 0,
  `related_products` text DEFAULT NULL,
  `createdate_product` datetime DEFAULT NULL,
  -- All individual size fields from external APIs
  `s_size` int(11) DEFAULT 0,
  `m_size` int(11) DEFAULT 0,
  `l_size` int(11) DEFAULT 0,
  `xl_size` int(11) DEFAULT 0,
  `xxl_size` int(11) DEFAULT 0,
  `3xl_size` int(11) DEFAULT 0,
  `4xl_size` int(11) DEFAULT 0,
  `xs_size` int(11) DEFAULT 0,
  `30_size` int(11) DEFAULT 0,
  `31_size` int(11) DEFAULT 0,
  `32_size` int(11) DEFAULT 0,
  `33_size` int(11) DEFAULT 0,
  `34_size` int(11) DEFAULT 0,
  `36_size` int(11) DEFAULT 0,
  `38_size` int(11) DEFAULT 0,
  `39_size` int(11) DEFAULT 0,
  `40_size` int(11) DEFAULT 0,
  `41_size` int(11) DEFAULT 0,
  `42_size` int(11) DEFAULT 0,
  `43_size` int(11) DEFAULT 0,
  `44_size` int(11) DEFAULT 0,
  `45_size` int(11) DEFAULT 0,
  `46_size` int(11) DEFAULT 0,
  `47_size` int(11) DEFAULT 0,
  `48_size` int(11) DEFAULT 0,
  `50_size` int(11) DEFAULT 0,
  `52_size` int(11) DEFAULT 0,
  `54_size` int(11) DEFAULT 0,
  `56_size` int(11) DEFAULT 0,
  `58_size` int(11) DEFAULT 0,
  `60_size` int(11) DEFAULT 0,
  `62_size` int(11) DEFAULT 0,
  `64_size` int(11) DEFAULT 0,
  `66_size` int(11) DEFAULT 0,
  `85_size` int(11) DEFAULT 0,
  `90_size` int(11) DEFAULT 0,
  `95_size` int(11) DEFAULT 0,
  `100_size` int(11) DEFAULT 0,
  `105_size` int(11) DEFAULT 0,
  `110_size` int(11) DEFAULT 0,
  `115_size` int(11) DEFAULT 0,
  `120_size` int(11) DEFAULT 0,
  `125_size` int(11) DEFAULT 0,
  `materials_configured` tinyint(1) DEFAULT 0,
  `sync_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_boutique_product` (`boutique_origin`, `external_product_id`),
  INDEX `idx_boutique_origin` (`boutique_origin`),
  INDEX `idx_status` (`status_product`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7️⃣ Table matériaux requis pour chaque produit
CREATE TABLE IF NOT EXISTS `production_product_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity_needed` decimal(10,3) NOT NULL,
  `quantity_type_id` int(11) NOT NULL,
  `size_specific` varchar(10) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `production_ready_products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_material_id` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8️⃣ Table batches de production
CREATE TABLE IF NOT EXISTS `production_batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_reference` varchar(100) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity_to_produce` int(11) NOT NULL,
  `sizes_breakdown` text DEFAULT NULL,
  `status` enum('planifie','en_cours','termine','a_collecter','en_magasin') DEFAULT 'planifie',
  `total_materials_cost` decimal(12,2) DEFAULT 0,
  `notification_emails` text DEFAULT NULL,
  `started_by` int(11) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `production_ready_products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`started_by`) REFERENCES `production_utilisateurs` (`id`),
  UNIQUE KEY `unique_batch_reference` (`batch_reference`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9️⃣ Table matériaux utilisés dans chaque batch
CREATE TABLE IF NOT EXISTS `production_batch_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity_used` decimal(10,3) NOT NULL,
  `quantity_type_id` int(11) NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT 0,
  `total_cost` decimal(12,2) DEFAULT 0,
  `transaction_id` bigint(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  FOREIGN KEY (`transaction_id`) REFERENCES `production_transactions_stock` (`transaction_id`) ON DELETE SET NULL,
  INDEX `idx_batch_id` (`batch_id`),
  INDEX `idx_material_id` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 🔟 Table synchronisation des boutiques
CREATE TABLE IF NOT EXISTS `production_sync_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `boutique` enum('luccibyey','spadadibattaglia') NOT NULL,
  `sync_type` enum('manual','automatic') DEFAULT 'manual',
  `products_found` int(11) DEFAULT 0,
  `products_added` int(11) DEFAULT 0,
  `products_updated` int(11) DEFAULT 0,
  `status` enum('success','error','partial') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `sync_duration` int(11) DEFAULT NULL,
  `started_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`started_by`) REFERENCES `production_utilisateurs` (`id`) ON DELETE SET NULL,
  INDEX `idx_boutique` (`boutique`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1️⃣1️⃣ Tables système original (produits, clients, commandes)
CREATE TABLE IF NOT EXISTS `production_produits` (
  `product_id` int(11) NOT NULL AUTO_INCREMENT,
  `reference` varchar(50) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `color` varchar(30) DEFAULT NULL,
  `other_attributes` json DEFAULT NULL,
  `created_user` int(11) NOT NULL,
  `modified_user` int(11) NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL,
  PRIMARY KEY (`product_id`),
  FOREIGN KEY (`created_user`) REFERENCES `production_utilisateurs` (`id`),
  FOREIGN KEY (`modified_user`) REFERENCES `production_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_produit_matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity_needed` decimal(10,2) NOT NULL,
  `size` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `production_produits` (`product_id`),
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_clients` (
  `client_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL,
  PRIMARY KEY (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_commandes_surmesure` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `delivery_date` date NOT NULL,
  `status` varchar(50) NOT NULL,
  `other_attributes` json DEFAULT NULL,
  `created_user` int(11) NOT NULL,
  `modified_user` int(11) NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL,
  PRIMARY KEY (`order_id`),
  FOREIGN KEY (`client_id`) REFERENCES `production_clients` (`client_id`),
  FOREIGN KEY (`created_user`) REFERENCES `production_utilisateurs` (`id`),
  FOREIGN KEY (`modified_user`) REFERENCES `production_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_commandes_mesures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `chest` decimal(5,2) NOT NULL,
  `waist` decimal(5,2) NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `other` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `production_commandes_surmesure` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_clients_externes` (
  `external_client_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `created_date` datetime NOT NULL,
  PRIMARY KEY (`external_client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_produits_externes` (
  `external_product_id` int(11) NOT NULL AUTO_INCREMENT,
  `external_client_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `color` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`external_product_id`),
  FOREIGN KEY (`external_client_id`) REFERENCES `production_clients_externes` (`external_client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_images` (
  `image_id` int(11) NOT NULL AUTO_INCREMENT,
  `related_type` enum('produit','matiere','commande') NOT NULL,
  `related_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_user` int(11) NOT NULL,
  `upload_date` datetime NOT NULL,
  PRIMARY KEY (`image_id`),
  FOREIGN KEY (`uploaded_user`) REFERENCES `production_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_videos` (
  `video_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_user` int(11) NOT NULL,
  `upload_date` datetime NOT NULL,
  PRIMARY KEY (`video_id`),
  FOREIGN KEY (`order_id`) REFERENCES `production_commandes_surmesure` (`order_id`),
  FOREIGN KEY (`uploaded_user`) REFERENCES `production_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_commandes_fichiers` (
  `file_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(20) NOT NULL,
  `uploaded_user` int(11) NOT NULL,
  `upload_date` datetime NOT NULL,
  PRIMARY KEY (`file_id`),
  FOREIGN KEY (`order_id`) REFERENCES `production_commandes_surmesure` (`order_id`),
  FOREIGN KEY (`uploaded_user`) REFERENCES `production_utilisateurs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- DONNÉES DE TEST / MOCK DATA
-- ========================================================

-- Utilisateurs
INSERT INTO `production_utilisateurs` (`nom`, `email`, `password`, `role`) VALUES
('Admin Production', 'admin@production.com', '$2y$10$example_hashed_password_admin', 'admin'),
('Manager Production', 'manager@production.com', '$2y$10$example_hashed_password_manager', 'production_manager'),
('Opérateur Production', 'operator@production.com', '$2y$10$example_hashed_password_operator', 'operator');

-- Types de quantité
INSERT INTO `production_quantity_types` (`nom`, `unite`, `description`) VALUES
('Mètres', 'm', 'Mesure en mètres pour les tissus et matériaux linéaires'),
('Kilogrammes', 'kg', 'Mesure en kilogrammes pour les matériaux en poids'),
('Pièces', 'pcs', 'Comptage en pièces pour les accessoires et boutons'),
('Litres', 'L', 'Mesure en litres pour les liquides'),
('Mètres carrés', 'm²', 'Mesure en mètres carrés pour les surfaces');

-- Catégories de matériaux
INSERT INTO `production_matieres_category` (`nom`, `description`, `color`) VALUES
('Tissus', 'Tous types de tissus pour la confection', '#3B82F6'),
('Fils', 'Fils de couture et broderie', '#10B981'),
('Accessoires', 'Boutons, fermetures éclair, etc.', '#F59E0B'),
('Doublures', 'Tissus de doublure', '#8B5CF6'),
('Cuirs', 'Matériaux en cuir pour accessoires', '#EF4444');

-- Matériaux
INSERT INTO `production_matieres` (`nom`, `reference`, `description`, `category_id`, `quantity_type_id`, `quantite_stock`, `quantite_min`, `quantite_max`, `prix_unitaire`, `couleur`, `fournisseur`) VALUES
('Laine Noir Premium', 'LAINE001', 'Laine de haute qualité pour smoking', 1, 1, 150.5, 20.0, 300.0, 45.50, 'Noir', 'Tissus de France'),
('Satin Noir Col', 'SAT001', 'Satin pour col de smoking', 1, 1, 25.0, 5.0, 50.0, 28.00, 'Noir', 'Soieries Lyon'),
('Fil Noir Polyester', 'FIL001', 'Fil de couture noir résistant', 2, 1, 500.0, 50.0, 1000.0, 2.50, 'Noir', 'Fils & Co'),
('Boutons Dorés', 'BTN001', 'Boutons dorés pour smoking', 3, 3, 200.0, 20.0, 500.0, 1.25, 'Doré', 'Accessoires Paris'),
('Cuir Veau Noir', 'CUIR001', 'Cuir de veau pour ceintures', 5, 1, 50.0, 10.0, 100.0, 65.00, 'Noir', 'Maroquinerie du Sud'),
('Boucle Métal Argenté', 'BOUC001', 'Boucle en métal argenté', 3, 3, 75.0, 10.0, 150.0, 8.50, 'Argenté', 'Accessoires Paris'),
('Doublure Soie Rouge', 'DOUB001', 'Doublure en soie rouge', 4, 1, 80.0, 15.0, 150.0, 18.00, 'Rouge', 'Soieries Lyon'),
('Fil Rouge Soie', 'FIL002', 'Fil de soie rouge pour finitions', 2, 1, 200.0, 25.0, 400.0, 4.50, 'Rouge', 'Fils & Co'),
('Coton Bio', 'COT001', 'Coton biologique blanc', 1, 1, 120.0, 25.0, 200.0, 15.50, 'Blanc', 'Tissus Bio France'),
('Lin Naturel', 'LIN001', 'Lin naturel écru', 1, 1, 80.0, 20.0, 150.0, 22.00, 'Écru', 'Lin de Normandie');

-- Transactions de stock
INSERT INTO `production_transactions_stock` (`material_id`, `type_mouvement`, `quantite`, `quantity_type_id`, `prix_unitaire`, `cout_total`, `motif`, `user_id`) VALUES
(1, 'in', 100.0, 1, 45.50, 4550.00, 'Approvisionnement initial', 1),
(2, 'in', 30.0, 1, 28.00, 840.00, 'Approvisionnement initial', 1),
(3, 'in', 500.0, 1, 2.50, 1250.00, 'Approvisionnement initial', 1),
(4, 'in', 250.0, 3, 1.25, 312.50, 'Approvisionnement initial', 1),
(5, 'in', 60.0, 1, 65.00, 3900.00, 'Approvisionnement initial', 1),
(6, 'in', 100.0, 3, 8.50, 850.00, 'Approvisionnement initial', 1),
(7, 'in', 100.0, 1, 18.00, 1800.00, 'Approvisionnement initial', 1),
(8, 'in', 250.0, 1, 4.50, 1125.00, 'Approvisionnement initial', 1),
(9, 'in', 150.0, 1, 15.50, 2325.00, 'Approvisionnement initial', 1),
(10, 'in', 100.0, 1, 22.00, 2200.00, 'Approvisionnement initial', 1);

-- Produits prêts pour la production
INSERT INTO `production_ready_products` (`boutique_origin`, `external_product_id`, `reference_product`, `nom_product`, `img_product`, `description_product`, `type_product`, `category_product`, `itemgroup_product`, `price_product`, `qnty_product`, `color_product`, `collection_product`, `auto_replenishment`, `auto_replenishment_quantity`, `auto_replenishment_quantity_sizes`, `sizes_data`, `materials_configured`) 
VALUES 
('luccibyey', '160', 'SMOKING CROISEE COL POINTE', 'SMOKING ROYAL CROISEE COL POINT', 'uploads/68b5693116e25_1756719409.jpg', 'Un smoking royal croisé en laine pour les grandes cérémonies', 'sur mesure', 'homme', 'smoking', 1399.00, 7, 'NOIR', 'Royal Collection', 1, 1, '[{"size": "42", "quantity": 20}, {"size": "44", "quantity": 20}, {"size": "46", "quantity": 15}]', '{"48_size": 1, "50_size": 1, "52_size": 1, "54_size": 2, "56_size": 2}', 1),
('spadadibattaglia', '100', 'DSC00385', 'CEINTURE', 'uploads/68b06c4b24ba3_1756392523.jpg', 'Ceinture en cuir de qualité', 'accessoires', 'homme', 'ceinture', 89.00, 0, 'NOIR', NULL, 1, 10, NULL, '{"85_size": 5, "90_size": 8, "95_size": 10, "100_size": 12, "105_size": 8, "110_size": 5}', 1),
('luccibyey', '165', 'CHEMISE CLASSIQUE', 'CHEMISE BUSINESS BLANC', 'uploads/chemise_classique.jpg', 'Chemise classique en coton bio', 'pret a porter', 'homme', 'chemise', 89.00, 15, 'BLANC', 'Business Collection', 1, 5, '[{"size": "M", "quantity": 10}, {"size": "L", "quantity": 8}, {"size": "XL", "quantity": 7}]', '{"S_size": 3, "M_size": 5, "L_size": 4, "XL_size": 3}', 1);

-- Configuration matériaux pour produits
INSERT INTO `production_product_materials` (`product_id`, `material_id`, `quantity_needed`, `quantity_type_id`, `size_specific`, `notes`) VALUES
-- Matériaux pour le smoking (product_id = 1)
(1, 1, 2.5, 1, NULL, 'Laine principale pour veste et pantalon'),
(1, 2, 0.3, 1, NULL, 'Satin pour col et revers'),
(1, 3, 50.0, 1, NULL, 'Fil de couture principal'),
(1, 4, 6.0, 3, NULL, 'Boutons pour veste'),
(1, 7, 1.0, 1, NULL, 'Doublure soie rouge'),
(1, 8, 20.0, 1, NULL, 'Fil rouge pour finitions'),
-- Matériaux pour la ceinture (product_id = 2)
(2, 5, 0.4, 1, NULL, 'Cuir principal pour la ceinture'),
(2, 6, 1.0, 3, NULL, 'Boucle métallique'),
(2, 3, 5.0, 1, NULL, 'Fil pour couture'),
-- Matériaux pour la chemise (product_id = 3)
(3, 9, 1.8, 1, NULL, 'Coton bio pour corps de chemise'),
(3, 3, 25.0, 1, NULL, 'Fil de couture'),
(3, 4, 8.0, 3, NULL, 'Boutons pour chemise');

-- Batches de production
INSERT INTO `production_batches` (`batch_reference`, `product_id`, `quantity_to_produce`, `sizes_breakdown`, `status`, `notification_emails`, `started_by`, `notes`) VALUES
('BATCH-SMOK-001', 1, 5, '{"48_size": 1, "50_size": 2, "52_size": 2}', 'planifie', 'production@atelier.com,manager@atelier.com', 2, 'Première production de smoking royal'),
('BATCH-CEIN-001', 2, 20, '{"90_size": 5, "95_size": 8, "100_size": 7}', 'en_cours', 'production@atelier.com', 2, 'Production ceintures noires'),
('BATCH-SMOK-002', 1, 3, '{"54_size": 2, "56_size": 1}', 'termine', 'production@atelier.com,manager@atelier.com', 2, 'Deuxième batch smoking - terminé'),
('BATCH-CHEM-001', 3, 10, '{"M_size": 4, "L_size": 4, "XL_size": 2}', 'planifie', 'production@atelier.com', 2, 'Production chemises business');

-- Matériaux utilisés pour les batches terminés
INSERT INTO `production_batch_materials` (`batch_id`, `material_id`, `quantity_used`, `quantity_type_id`, `unit_cost`, `total_cost`) VALUES
-- Matériaux utilisés pour BATCH-SMOK-002 (terminé)
(3, 1, 7.5, 1, 45.50, 341.25),  -- 3 smokings x 2.5m laine = 7.5m
(3, 2, 0.9, 1, 28.00, 25.20),   -- 3 smokings x 0.3m satin = 0.9m
(3, 3, 150.0, 1, 2.50, 375.00), -- 3 smokings x 50m fil = 150m
(3, 4, 18.0, 3, 1.25, 22.50),   -- 3 smokings x 6 boutons = 18 boutons
(3, 7, 3.0, 1, 18.00, 54.00),   -- 3 smokings x 1m doublure = 3m
(3, 8, 60.0, 1, 4.50, 270.00),  -- 3 smokings x 20m fil rouge = 60m
-- Matériaux utilisés pour BATCH-CEIN-001 (en cours - partiellement utilisé)
(2, 5, 6.0, 1, 65.00, 390.00),  -- 15 ceintures x 0.4m cuir = 6m (sur 20 prévues)
(2, 6, 15.0, 3, 8.50, 127.50),  -- 15 boucles (sur 20 prévues)
(2, 3, 75.0, 1, 2.50, 187.50);  -- 15 ceintures x 5m fil = 75m

-- Mettre à jour les coûts totaux des batches
UPDATE `production_batches` SET 
    `total_materials_cost` = 1087.95,
    `completed_at` = NOW() 
WHERE `batch_reference` = 'BATCH-SMOK-002';

UPDATE `production_batches` SET 
    `total_materials_cost` = 705.00
WHERE `batch_reference` = 'BATCH-CEIN-001';

-- Logs de synchronisation
INSERT INTO `production_sync_log` (`boutique`, `sync_type`, `products_found`, `products_added`, `products_updated`, `status`, `sync_duration`, `started_by`) VALUES
('luccibyey', 'manual', 2, 2, 0, 'success', 2500, 1),
('spadadibattaglia', 'manual', 1, 1, 0, 'success', 1800, 1),
('luccibyey', 'automatic', 2, 0, 2, 'success', 1200, NULL),
('spadadibattaglia', 'automatic', 1, 0, 1, 'success', 950, NULL);

-- Données système original
INSERT INTO `production_produits` (`reference`, `title`, `color`, `other_attributes`, `created_user`, `modified_user`, `created_date`, `modified_date`) VALUES
('PROD001', 'Chemise Classique', 'Blanc', '{"taille": ["S", "M", "L", "XL"], "style": "classique"}', 1, 1, NOW(), NOW()),
('PROD002', 'Pull Hiver', 'Gris', '{"saison": "hiver", "motif": "uni"}', 1, 1, NOW(), NOW()),
('PROD003', 'Robe Été', 'Crème', '{"saison": "été", "longueur": "midi"}', 1, 1, NOW(), NOW()),
('PROD004', 'Pantalon Lin', 'Beige', '{"style": "décontracté", "coupe": "droite"}', 1, 1, NOW(), NOW());

INSERT INTO `production_produit_matieres` (`product_id`, `material_id`, `quantity_needed`, `size`) VALUES
(1, 9, 2.50, 'M'),
(2, 1, 0.80, 'L'),
(3, 7, 3.00, 'M'),
(4, 10, 2.20, 'L');

INSERT INTO `production_clients` (`first_name`, `last_name`, `email`, `phone`, `created_date`, `modified_date`) VALUES
('Marie', 'Dubois', 'marie.dubois@email.com', '0601234567', NOW(), NOW()),
('Pierre', 'Martin', 'pierre.martin@email.com', '0612345678', NOW(), NOW()),
('Sophie', 'Leroy', 'sophie.leroy@email.com', '0623456789', NOW(), NOW()),
('Antoine', 'Moreau', 'antoine.moreau@email.com', '0634567890', NOW(), NOW());

INSERT INTO `production_commandes_surmesure` (`client_id`, `delivery_date`, `status`, `other_attributes`, `created_user`, `modified_user`, `created_date`, `modified_date`) VALUES
(1, '2024-12-15', 'en_cours', '{"urgence": "normale", "notes": "Préfère les couleurs claires"}', 1, 1, NOW(), NOW()),
(2, '2024-12-20', 'en_attente', '{"urgence": "haute", "notes": "Client VIP"}', 1, 1, NOW(), NOW()),
(3, '2025-01-10', 'planifiee', '{"urgence": "basse"}', 1, 1, NOW(), NOW());

INSERT INTO `production_commandes_mesures` (`order_id`, `chest`, `waist`, `height`, `other`) VALUES
(1, 92.50, 78.00, 175.00, 'Épaules larges'),
(2, 105.00, 95.00, 182.00, 'Corpulence forte'),
(3, 88.00, 72.00, 165.00, 'Silhouette fine');

INSERT INTO `production_clients_externes` (`name`, `contact`, `created_date`) VALUES
('Atelier Couture Lyon', 'contact@atelierlyon.fr', NOW()),
('Broderie Parisienne', 'info@broderieparis.fr', NOW()),
('Maison de la Soie', 'commande@maisonsoie.fr', NOW());

INSERT INTO `production_produits_externes` (`external_client_id`, `title`, `color`) VALUES
(1, 'Broderie Logo', 'Doré'),
(2, 'Finition Boutons', 'Nacre'),
(3, 'Doublure Soie', 'Noir');

INSERT INTO `production_images` (`related_type`, `related_id`, `file_path`, `uploaded_user`, `upload_date`) VALUES
('produit', 1, '/uploads/products/chemise_classique.jpg', 1, NOW()),
('produit', 2, '/uploads/products/pull_hiver.jpg', 1, NOW()),
('matiere', 1, '/uploads/materials/laine_noir.jpg', 1, NOW()),
('matiere', 9, '/uploads/materials/coton_bio.jpg', 1, NOW());

INSERT INTO `production_commandes_fichiers` (`order_id`, `file_path`, `file_type`, `uploaded_user`, `upload_date`) VALUES
(1, '/uploads/orders/cahier_charges_001.pdf', 'PDF', 1, NOW()),
(2, '/uploads/orders/specification_002.docx', 'DOCX', 1, NOW());