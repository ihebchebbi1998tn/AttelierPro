-- ============================================
-- Script to add supplier (fournisseur) support
-- ============================================

-- 1️⃣ Create suppliers table
CREATE TABLE IF NOT EXISTS `production_materials_fournisseurs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  INDEX `idx_name` (`name`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2️⃣ Add id_fournisseur column to materials table
ALTER TABLE `production_matieres` 
ADD COLUMN `id_fournisseur` int(11) DEFAULT NULL AFTER `fournisseur`,
ADD FOREIGN KEY (`id_fournisseur`) REFERENCES `production_materials_fournisseurs` (`id`) ON DELETE SET NULL,
ADD INDEX `idx_fournisseur` (`id_fournisseur`);

-- 3️⃣ Insert some sample suppliers
INSERT INTO `production_materials_fournisseurs` (`name`, `address`, `email`, `phone`) VALUES
('Textile Import', '123 Rue de la Soie, Tunis', 'contact@textileimport.tn', '+216 71 123 456'),
('Matériaux Premium', '456 Avenue Habib Bourguiba, Sfax', 'info@materiauxpremium.tn', '+216 74 987 654'),
('Fournisseur Global', '789 Boulevard 7 Novembre, Sousse', 'orders@fournisseurglobal.tn', '+216 73 555 777');

-- 4️⃣ Update existing materials to link with suppliers (optional migration)
-- This migrates existing text-based supplier info to the new table
-- UPDATE production_matieres SET id_fournisseur = 1 WHERE fournisseur LIKE '%textile%';
-- UPDATE production_matieres SET id_fournisseur = 2 WHERE fournisseur LIKE '%premium%';