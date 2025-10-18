-- Create table for surmesure materials configuration
CREATE TABLE IF NOT EXISTS `production_surmesure_matieres` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `commande_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity_needed` decimal(10,3) NOT NULL DEFAULT 0.000,
  `quantity_type_id` int(11) NOT NULL DEFAULT 1,
  `commentaire` text DEFAULT NULL,
  `stock_deducted` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Track if stock has been deducted for this material',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_commande_id` (`commande_id`),
  KEY `idx_material_id` (`material_id`),
  KEY `idx_quantity_type_id` (`quantity_type_id`),
  KEY `idx_stock_deducted` (`stock_deducted`),
  KEY `idx_commande_deducted` (`commande_id`, `stock_deducted`),
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for better performance
CREATE INDEX `idx_commande_material` ON `production_surmesure_matieres` (`commande_id`, `material_id`);