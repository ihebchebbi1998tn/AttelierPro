-- Create batch leftovers table to track leftover/wasted materials after production
CREATE TABLE IF NOT EXISTS `production_batch_leftovers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `batch_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `leftover_quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_reusable` tinyint(1) DEFAULT 1 COMMENT 'Whether the leftover is reusable',
  `readded_to_stock` tinyint(1) DEFAULT 0 COMMENT 'Whether leftover was readded to stock',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_batch_id` (`batch_id`),
  KEY `idx_material_id` (`material_id`),
  KEY `idx_readded_to_stock` (`readded_to_stock`),
  FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
