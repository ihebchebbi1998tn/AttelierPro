-- Create soustraitance product materials table
CREATE TABLE IF NOT EXISTS `production_soustraitance_product_materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity_needed` decimal(10,3) NOT NULL,
  `quantity_type_id` int(11) NOT NULL,
  `size_specific` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_material_id` (`material_id`),
  KEY `idx_quantity_type_id` (`quantity_type_id`),
  FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;