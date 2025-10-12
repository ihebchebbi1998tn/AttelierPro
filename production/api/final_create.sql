-- ========================================================
-- Script SQL complet pour le système de production textile
-- Inclut: gestion boutiques, synchronisation, production, stock
-- Version finale consolidée avec toutes les tables et données de test
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
-- DONNÉES DE TEST / MOCK DATA COMPLÈTES
-- ========================================================

-- Utilisateurs
INSERT INTO `production_utilisateurs` (`nom`, `email`, `password`, `role`) VALUES
('Admin Production', 'admin@production.com', '$2y$10$example_hashed_password_admin', 'admin'),
('Manager Production', 'manager@production.com', '$2y$10$example_hashed_password_manager', 'production_manager'),
('Opérateur Production', 'operator@production.com', '$2y$10$example_hashed_password_operator', 'operator'),
('Jean Dupont', 'jean.dupont@production.com', '$2y$10$hashed_password_jean', 'production_manager'),
('Marie Martin', 'marie.martin@production.com', '$2y$10$hashed_password_marie', 'operator'),
('Pierre Bernard', 'pierre.bernard@production.com', '$2y$10$hashed_password_pierre', 'operator');

-- Types de quantité
INSERT INTO `production_quantity_types` (`nom`, `unite`, `description`) VALUES
('Mètres', 'm', 'Mesure en mètres pour les tissus et matériaux linéaires'),
('Kilogrammes', 'kg', 'Mesure en kilogrammes pour les matériaux en poids'),
('Pièces', 'pcs', 'Comptage en pièces pour les accessoires et boutons'),
('Litres', 'L', 'Mesure en litres pour les liquides'),
('Mètres carrés', 'm²', 'Mesure en mètres carrés pour les surfaces'),
('Bobines', 'bobines', 'Comptage en bobines pour les fils');

-- Catégories de matériaux
INSERT INTO `production_matieres_category` (`nom`, `description`, `color`) VALUES
('Tissus', 'Tous types de tissus pour la confection', '#3B82F6'),
('Fils', 'Fils de couture et broderie', '#10B981'),
('Accessoires', 'Boutons, fermetures éclair, etc.', '#F59E0B'),
('Doublures', 'Tissus de doublure', '#8B5CF6'),
('Cuirs', 'Matériaux en cuir pour accessoires', '#EF4444'),
('Garnitures', 'Garnitures et finitions', '#6366F1'),
('Outils', 'Outils de production', '#84CC16');

-- Matériaux avec données complètes
INSERT INTO `production_matieres` (`nom`, `reference`, `description`, `category_id`, `quantity_type_id`, `quantite_stock`, `quantite_min`, `quantite_max`, `prix_unitaire`, `couleur`, `fournisseur`, `location`, `taille`) VALUES
('Laine Noir Premium', 'LAINE001', 'Laine de haute qualité pour smoking', 1, 1, 150.500, 20.000, 300.000, 45.50, 'Noir', 'Tissus de France', 'Entrepôt A-1', 'Standard'),
('Satin Noir Col', 'SAT001', 'Satin pour col de smoking', 1, 1, 25.000, 5.000, 50.000, 28.00, 'Noir', 'Soieries Lyon', 'Entrepôt A-2', 'Standard'),
('Fil Noir 120/2', 'FIL001', 'Fil de couture polyester noir', 2, 6, 50.000, 10.000, 100.000, 3.50, 'Noir', 'Fils Madeira', 'Entrepôt B-1', 'Standard'),
('Boutons Nacre 18mm', 'BTN001', 'Boutons en nacre naturelle', 3, 3, 500.000, 100.000, 1000.000, 0.85, 'Blanc', 'Accessoires Paris', 'Entrepôt C-1', '18mm'),
('Doublure Polyester Noir', 'DOUB001', 'Doublure standard polyester', 4, 1, 75.000, 15.000, 150.000, 12.00, 'Noir', 'Doublures France', 'Entrepôt A-3', 'Standard'),
('Cuir Agneau Noir', 'CUIR001', 'Cuir d\'agneau pour accessoires', 5, 5, 10.500, 2.000, 25.000, 95.00, 'Noir', 'Tanneries Françaises', 'Entrepôt D-1', 'Standard'),
('Laine Bleu Marine', 'LAINE002', 'Laine pour costumes bleu marine', 1, 1, 120.000, 15.000, 250.000, 42.00, 'Bleu Marine', 'Tissus de France', 'Entrepôt A-4', 'Standard'),
('Fil Bleu Marine 120/2', 'FIL002', 'Fil de couture polyester bleu marine', 2, 6, 45.000, 10.000, 90.000, 3.50, 'Bleu Marine', 'Fils Madeira', 'Entrepôt B-2', 'Standard'),
('Fermeture Éclair 20cm', 'ZIP001', 'Fermeture éclair invisible', 3, 3, 200.000, 50.000, 400.000, 1.25, 'Noir', 'YKK France', 'Entrepôt C-2', '20cm'),
('Interfaçage Thermocollant', 'INT001', 'Interfaçage pour vestes', 1, 1, 35.000, 8.000, 70.000, 8.50, 'Blanc', 'Freudenberg', 'Entrepôt A-5', 'Standard'),
('Tissu Coton Blanc', 'COT001', 'Coton pure pour chemises', 1, 1, 85.000, 20.000, 180.000, 18.00, 'Blanc', 'Cotons de France', 'Entrepôt A-6', 'Standard'),
('Élastique 5mm', 'ELA001', 'Élastique pour ceintures', 3, 1, 100.000, 25.000, 200.000, 2.30, 'Noir', 'Élastiques Martin', 'Entrepôt C-3', '5mm'),
('Soie Naturelle Crème', 'SOIE001', 'Soie naturelle pour doublure premium', 4, 1, 18.000, 3.000, 40.000, 125.00, 'Crème', 'Soieries de Lyon', 'Entrepôt A-7', 'Standard'),
('Fil Or Métallique', 'FILM001', 'Fil métallique pour broderies', 2, 6, 15.000, 3.000, 30.000, 12.50, 'Or', 'Broderies Françaises', 'Entrepôt B-3', 'Standard'),
('Velours Côtelé Bordeaux', 'VEL001', 'Velours côtelé pour pantalons', 1, 1, 45.000, 10.000, 90.000, 35.00, 'Bordeaux', 'Velours du Nord', 'Entrepôt A-8', 'Standard');

-- Transactions de stock (historique des mouvements)
INSERT INTO `production_transactions_stock` (`material_id`, `type_mouvement`, `quantite`, `quantity_type_id`, `prix_unitaire`, `cout_total`, `motif`, `reference_commande`, `notes`, `user_id`, `date_transaction`) VALUES
(1, 'in', 50.000, 1, 45.50, 2275.00, 'Réapprovisionnement', 'ACHAT001', 'Livraison fournisseur Tissus de France', 1, '2024-01-15 09:30:00'),
(2, 'in', 25.000, 1, 28.00, 700.00, 'Stock initial', 'INIT001', 'Mise en stock initiale', 1, '2024-01-15 10:00:00'),
(3, 'in', 100.000, 6, 3.50, 350.00, 'Commande trimestrielle', 'TRIM001', 'Commande fils Q1', 2, '2024-01-20 14:15:00'),
(4, 'in', 1000.000, 3, 0.85, 850.00, 'Stock saisonnier', 'SAIS001', 'Préparation saison printemps', 2, '2024-01-22 11:00:00'),
(1, 'out', 15.500, 1, 45.50, 705.25, 'Production batch', 'BATCH001', 'Utilisation pour smoking noir taille 50', 3, '2024-02-01 08:45:00'),
(2, 'out', 2.000, 1, 28.00, 56.00, 'Production batch', 'BATCH001', 'Col smoking noir taille 50', 3, '2024-02-01 09:15:00'),
(3, 'out', 5.000, 6, 3.50, 17.50, 'Production batch', 'BATCH001', 'Couture smoking noir', 3, '2024-02-01 10:00:00'),
(5, 'in', 50.000, 1, 12.00, 600.00, 'Réapprovisionnement', 'ACHAT002', 'Doublures diverses', 1, '2024-02-05 13:30:00'),
(6, 'in', 5.000, 5, 95.00, 475.00, 'Commande spéciale', 'SPEC001', 'Cuir premium pour collection', 1, '2024-02-08 16:00:00'),
(7, 'in', 75.000, 1, 42.00, 3150.00, 'Stock printemps', 'PRINT001', 'Costumes bleu marine collection', 2, '2024-02-10 09:00:00'),
(1, 'out', 8.000, 1, 45.50, 364.00, 'Production urgente', 'URG001', 'Commande client VIP', 4, '2024-02-12 15:30:00'),
(7, 'out', 12.000, 1, 42.00, 504.00, 'Production batch', 'BATCH002', 'Costume bleu marine taille 48', 5, '2024-02-15 11:15:00'),
(8, 'out', 3.000, 6, 3.50, 10.50, 'Production batch', 'BATCH002', 'Couture costume bleu marine', 5, '2024-02-15 11:30:00'),
(9, 'out', 50.000, 3, 1.25, 62.50, 'Production diverses', 'PROD001', 'Fermetures éclair pantalons', 6, '2024-02-18 14:00:00'),
(11, 'in', 40.000, 1, 18.00, 720.00, 'Commande chemises', 'CHEM001', 'Coton blanc pour chemises', 2, '2024-02-20 10:30:00'),
(15, 'in', 30.000, 1, 35.00, 1050.00, 'Nouveauté collection', 'NOUV001', 'Velours bordeaux automne', 1, '2024-02-22 16:45:00');

-- Produits synchronisés depuis les boutiques
INSERT INTO `production_ready_products` (`boutique_origin`, `external_product_id`, `reference_product`, `nom_product`, `description_product`, `type_product`, `category_product`, `price_product`, `color_product`, `status_product`, `m_size`, `l_size`, `xl_size`, `xxl_size`) VALUES
('luccibyey', 'LUCCI001', 'SMK-NOIR-001', 'Smoking Noir Classique', 'Smoking noir en laine premium avec satin col', 'Smoking', 'Formal', 899.00, 'Noir', 'active', 5, 8, 6, 3),
('luccibyey', 'LUCCI002', 'COST-BLM-002', 'Costume Bleu Marine', 'Costume bleu marine business coupe slim', 'Costume', 'Business', 649.00, 'Bleu Marine', 'active', 10, 12, 8, 4),
('spadadibattaglia', 'SPADA001', 'VEST-BOR-003', 'Veste Bordeaux Premium', 'Veste en velours côtelé bordeaux', 'Veste', 'Casual', 450.00, 'Bordeaux', 'active', 6, 9, 7, 2),
('luccibyey', 'LUCCI003', 'PANT-NOIR-004', 'Pantalon Noir Formal', 'Pantalon de smoking noir', 'Pantalon', 'Formal', 299.00, 'Noir', 'active', 8, 10, 6, 3),
('spadadibattaglia', 'SPADA002', 'CHEM-BLC-005', 'Chemise Blanche Premium', 'Chemise coton blanc col français', 'Chemise', 'Business', 129.00, 'Blanc', 'active', 15, 18, 12, 6);

-- Configuration matériaux pour produits
INSERT INTO `production_product_materials` (`product_id`, `material_id`, `quantity_needed`, `quantity_type_id`, `size_specific`, `notes`) VALUES
-- Smoking Noir (product_id = 1)
(1, 1, 2.500, 1, 'ALL', 'Laine principale pour veste et pantalon'),
(1, 2, 0.300, 1, 'ALL', 'Satin pour col et revers'),
(1, 3, 1.000, 6, 'ALL', 'Fil de couture principal'),
(1, 4, 8.000, 3, 'ALL', 'Boutons veste et manchettes'),
(1, 5, 1.200, 1, 'ALL', 'Doublure veste'),
-- Costume Bleu Marine (product_id = 2)
(2, 7, 3.200, 1, 'ALL', 'Laine bleu marine veste et pantalon'),
(2, 8, 1.200, 6, 'ALL', 'Fil bleu marine'),
(2, 4, 6.000, 3, 'ALL', 'Boutons costume'),
(2, 5, 1.500, 1, 'ALL', 'Doublure'),
-- Veste Bordeaux (product_id = 3)
(3, 15, 1.800, 1, 'ALL', 'Velours bordeaux'),
(3, 3, 0.800, 6, 'ALL', 'Fil noir pour coutures'),
(3, 4, 4.000, 3, 'ALL', 'Boutons veste'),
-- Pantalon Noir (product_id = 4)
(4, 1, 1.200, 1, 'ALL', 'Laine noire'),
(4, 3, 0.500, 6, 'ALL', 'Fil noir'),
(4, 9, 1.000, 3, 'ALL', 'Fermeture éclair'),
-- Chemise Blanche (product_id = 5)
(5, 11, 1.800, 1, 'ALL', 'Coton blanc'),
(5, 3, 0.400, 6, 'ALL', 'Fil noir pour coutures'),
(5, 4, 7.000, 3, 'ALL', 'Boutons chemise');

-- Batches de production
INSERT INTO `production_batches` (`batch_reference`, `product_id`, `quantity_to_produce`, `sizes_breakdown`, `status`, `total_materials_cost`, `started_by`, `started_at`, `completed_at`, `notes`) VALUES
('BATCH-SMK-001', 1, 22, '{"M": 5, "L": 8, "XL": 6, "XXL": 3}', 'termine', 1856.50, 3, '2024-02-01 08:00:00', '2024-02-08 17:30:00', 'Smokings noirs pour commande mariage'),
('BATCH-COST-001', 2, 34, '{"M": 10, "L": 12, "XL": 8, "XXL": 4}', 'en_cours', 2890.20, 4, '2024-02-15 09:00:00', NULL, 'Costumes bleu marine collection printemps'),
('BATCH-VEST-001', 3, 24, '{"M": 6, "L": 9, "XL": 7, "XXL": 2}', 'planifie', 0.00, NULL, NULL, NULL, 'Vestes bordeaux collection automne'),
('BATCH-PANT-001', 4, 27, '{"M": 8, "L": 10, "XL": 6, "XXL": 3}', 'termine', 945.75, 5, '2024-02-10 10:00:00', '2024-02-14 16:00:00', 'Pantalons noirs formal'),
('BATCH-CHEM-001', 5, 51, '{"M": 15, "L": 18, "XL": 12, "XXL": 6}', 'a_collecter', 1275.30, 6, '2024-02-20 08:30:00', '2024-02-25 15:45:00', 'Chemises blanches premium');

-- Matériaux utilisés dans les batches
INSERT INTO `production_batch_materials` (`batch_id`, `material_id`, `quantity_used`, `quantity_type_id`, `unit_cost`, `total_cost`) VALUES
-- Batch Smoking (batch_id = 1)
(1, 1, 55.000, 1, 45.50, 2502.50),
(1, 2, 6.600, 1, 28.00, 184.80),
(1, 3, 22.000, 6, 3.50, 77.00),
(1, 4, 176.000, 3, 0.85, 149.60),
(1, 5, 26.400, 1, 12.00, 316.80),
-- Batch Costume (batch_id = 2)  
(2, 7, 108.800, 1, 42.00, 4569.60),
(2, 8, 40.800, 6, 3.50, 142.80),
(2, 4, 204.000, 3, 0.85, 173.40),
(2, 5, 51.000, 1, 12.00, 612.00),
-- Batch Pantalon (batch_id = 4)
(4, 1, 32.400, 1, 45.50, 1474.20),
(4, 3, 13.500, 6, 3.50, 47.25),
(4, 9, 27.000, 3, 1.25, 33.75),
-- Batch Chemise (batch_id = 5)
(5, 11, 91.800, 1, 18.00, 1652.40),
(5, 3, 20.400, 6, 3.50, 71.40),
(5, 4, 357.000, 3, 0.85, 303.45);

-- Logs de synchronisation
INSERT INTO `production_sync_log` (`boutique`, `sync_type`, `products_found`, `products_added`, `products_updated`, `status`, `sync_duration`, `started_by`) VALUES
('luccibyey', 'manual', 15, 3, 0, 'success', 45, 1),
('spadadibattaglia', 'manual', 8, 2, 0, 'success', 32, 1),
('luccibyey', 'automatic', 15, 0, 2, 'success', 28, NULL),
('spadadibattaglia', 'automatic', 8, 0, 1, 'success', 22, NULL);

-- Produits système original
INSERT INTO `production_produits` (`reference`, `title`, `color`, `other_attributes`, `created_user`, `modified_user`, `created_date`, `modified_date`) VALUES
('ORIG-001', 'Costume Sur-Mesure Classic', 'Gris Anthracite', '{"style": "classic", "season": "all"}', 1, 1, '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
('ORIG-002', 'Smoking Sur-Mesure Deluxe', 'Noir', '{"style": "deluxe", "occasion": "formal"}', 2, 2, '2024-01-12 14:30:00', '2024-01-15 09:15:00'),
('ORIG-003', 'Veste Casual Premium', 'Bleu Nuit', '{"style": "casual", "material": "premium"}', 1, 3, '2024-01-15 11:45:00', '2024-01-15 11:45:00');

-- Relations produits-matériaux système original
INSERT INTO `production_produit_matieres` (`product_id`, `material_id`, `quantity_needed`, `size`) VALUES
(1, 1, 3.50, 'ALL'),
(1, 3, 1.20, 'ALL'),
(1, 4, 8.00, 'ALL'),
(2, 1, 2.80, 'ALL'),
(2, 2, 0.40, 'ALL'),
(2, 14, 0.50, 'ALL'),
(3, 15, 2.20, 'ALL'),
(3, 3, 0.90, 'ALL');

-- Clients
INSERT INTO `production_clients` (`first_name`, `last_name`, `email`, `phone`, `created_date`, `modified_date`) VALUES
('Jean', 'Dupont', 'jean.dupont@email.com', '06.12.34.56.78', '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
('Marie', 'Martin', 'marie.martin@email.com', '06.23.45.67.89', '2024-01-18 14:15:00', '2024-01-18 14:15:00'),
('Pierre', 'Bernard', 'pierre.bernard@email.com', '06.34.56.78.90', '2024-01-20 16:45:00', '2024-01-22 11:20:00'),
('Sophie', 'Durand', 'sophie.durand@email.com', '06.45.67.89.01', '2024-01-25 09:00:00', '2024-01-25 09:00:00'),
('Nicolas', 'Leroy', 'nicolas.leroy@email.com', '06.56.78.90.12', '2024-02-01 13:30:00', '2024-02-01 13:30:00');

-- Commandes sur mesure
INSERT INTO `production_commandes_surmesure` (`client_id`, `delivery_date`, `status`, `other_attributes`, `created_user`, `modified_user`, `created_date`, `modified_date`) VALUES
(1, '2024-03-15', 'en_production', '{"occasion": "mariage", "urgence": "normale"}', 2, 3, '2024-01-20 10:00:00', '2024-02-01 14:30:00'),
(2, '2024-03-22', 'mesures_prises', '{"occasion": "business", "style": "moderne"}', 1, 1, '2024-01-25 15:30:00', '2024-01-30 09:15:00'),
(3, '2024-04-10', 'commande_validee', '{"occasion": "ceremonie", "couleur_preference": "bleu_marine"}', 2, 2, '2024-02-02 11:45:00', '2024-02-05 16:20:00'),
(4, '2024-04-18', 'essayage_programme', '{"occasion": "soiree", "style": "classic"}', 3, 4, '2024-02-08 14:00:00', '2024-02-12 10:30:00'),
(5, '2024-05-05', 'mesures_prises', '{"occasion": "business", "taille_speciale": true}', 1, 2, '2024-02-15 16:30:00', '2024-02-18 13:45:00');

-- Mesures pour commandes sur mesure
INSERT INTO `production_commandes_mesures` (`order_id`, `chest`, `waist`, `height`, `other`) VALUES
(1, 102.50, 88.00, 178.00, '{"shoulder": 45.5, "sleeve": 65.2, "neck": 41.0}'),
(2, 96.00, 82.50, 172.50, '{"shoulder": 44.0, "sleeve": 63.8, "neck": 39.5}'),
(3, 108.00, 95.00, 185.00, '{"shoulder": 48.0, "sleeve": 67.5, "neck": 43.0}'),
(4, 94.50, 78.00, 168.00, '{"shoulder": 42.5, "sleeve": 61.0, "neck": 38.0}'),
(5, 110.50, 98.50, 188.50, '{"shoulder": 49.5, "sleeve": 68.8, "neck": 44.5}');

-- Clients externes (sous-traitance)
INSERT INTO `production_clients_externes` (`name`, `contact`, `created_date`) VALUES
('Atelier Parisien Broderie', 'contact@broderie-paris.fr', '2024-01-10 09:00:00'),
('Maroquinerie Artisanale Lyon', 'info@maroquinerie-lyon.fr', '2024-01-12 14:30:00'),
('Pressing Luxury Services', 'service@pressing-luxury.com', '2024-01-15 11:15:00'),
('Retouches Express Premium', 'contact@retouches-premium.fr', '2024-01-18 16:45:00');

-- Produits externes (sous-traitance)
INSERT INTO `production_produits_externes` (`external_client_id`, `title`, `color`) VALUES
(1, 'Broderie Monogramme Deluxe', 'Or'),
(1, 'Broderie Motif Floral', 'Argent'),
(2, 'Étui Cuir Sur-Mesure', 'Noir'),
(2, 'Ceinture Cuir Premium', 'Marron'),
(3, 'Nettoyage Smoking Premium', 'N/A'),
(4, 'Retouches Urgentes Veste', 'N/A');

-- Images associées
INSERT INTO `production_images` (`related_type`, `related_id`, `file_path`, `uploaded_user`, `upload_date`) VALUES
('matiere', 1, '/uploads/materials/laine_noir_001.jpg', 1, '2024-01-15 10:30:00'),
('matiere', 2, '/uploads/materials/satin_noir_001.jpg', 1, '2024-01-15 11:00:00'),
('matiere', 6, '/uploads/materials/cuir_agneau_001.jpg', 2, '2024-02-08 16:30:00'),
('commande', 1, '/uploads/orders/commande_001_croquis.jpg', 2, '2024-01-20 15:00:00'),
('commande', 1, '/uploads/orders/commande_001_mesures.pdf', 2, '2024-01-22 09:30:00'),
('produit', 1, '/uploads/products/smoking_noir_model.jpg', 1, '2024-01-10 14:00:00');

-- Vidéos pour commandes
INSERT INTO `production_videos` (`order_id`, `file_path`, `uploaded_user`, `upload_date`) VALUES
(1, '/uploads/videos/commande_001_essayage.mp4', 3, '2024-02-05 14:30:00'),
(4, '/uploads/videos/commande_004_presentation.mp4', 4, '2024-02-12 16:15:00');

-- Fichiers pour commandes
INSERT INTO `production_commandes_fichiers` (`order_id`, `file_path`, `file_type`, `uploaded_user`, `upload_date`) VALUES
(1, '/uploads/files/commande_001_contrat.pdf', 'PDF', 2, '2024-01-20 11:00:00'),
(1, '/uploads/files/commande_001_facture.pdf', 'PDF', 1, '2024-01-22 15:30:00'),
(2, '/uploads/files/commande_002_devis.pdf', 'PDF', 1, '2024-01-25 16:00:00'),
(3, '/uploads/files/commande_003_cahier_charges.docx', 'DOCX', 2, '2024-02-02 12:30:00'),
(4, '/uploads/files/commande_004_planning.xlsx', 'XLSX', 3, '2024-02-08 14:45:00'),
(5, '/uploads/files/commande_005_specifications.pdf', 'PDF', 1, '2024-02-15 17:00:00');

-- Mise à jour des coûts totaux des batches terminés
UPDATE `production_batches` SET `total_materials_cost` = 3230.70 WHERE `id` = 1;
UPDATE `production_batches` SET `total_materials_cost` = 5497.80 WHERE `id` = 2;
UPDATE `production_batches` SET `total_materials_cost` = 1555.20 WHERE `id` = 4;
UPDATE `production_batches` SET `total_materials_cost` = 2027.25 WHERE `id` = 5;

-- Finalisation
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- FIN DU SCRIPT - Base de données complète initialisée
-- ========================================================