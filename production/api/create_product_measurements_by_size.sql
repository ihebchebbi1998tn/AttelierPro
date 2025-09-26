-- Drop existing measurement tables to recreate with size support
DROP TABLE IF EXISTS `production_ready_products_mesure`;
DROP TABLE IF EXISTS `production_soustraitance_products_mesure`;

-- Create measurement tables that support measurements per size

-- Table for regular products measurements (with size support)
CREATE TABLE IF NOT EXISTS `production_ready_products_mesure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `measurement_name` varchar(255) NOT NULL,
  `size_value` varchar(50) NOT NULL COMMENT 'Size like S, M, L, XL, or numeric sizes',
  `measurement_value` decimal(6,2) DEFAULT NULL COMMENT 'Measurement value for this size',
  `tolerance` decimal(3,2) DEFAULT 0.5 COMMENT 'Tolerance in cm',
  `unit` varchar(10) DEFAULT 'cm',
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_measurement_size` (`product_id`, `measurement_name`, `size_value`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_measurement_name` (`measurement_name`),
  KEY `idx_size_value` (`size_value`),
  CONSTRAINT `production_ready_products_mesure_ibfk_1`
    FOREIGN KEY (`product_id`) REFERENCES `production_ready_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for soustraitance products measurements (with size support)
CREATE TABLE IF NOT EXISTS `production_soustraitance_products_mesure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `measurement_name` varchar(255) NOT NULL,
  `size_value` varchar(50) NOT NULL COMMENT 'Size like S, M, L, XL, or numeric sizes',
  `measurement_value` decimal(6,2) DEFAULT NULL COMMENT 'Measurement value for this size',
  `tolerance` decimal(3,2) DEFAULT 0.5 COMMENT 'Tolerance in cm',
  `unit` varchar(10) DEFAULT 'cm',
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_measurement_size` (`product_id`, `measurement_name`, `size_value`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_measurement_name` (`measurement_name`),
  KEY `idx_size_value` (`size_value`),
  CONSTRAINT `production_soustraitance_products_mesure_ibfk_1`
    FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample measurements with size support for regular products
INSERT INTO `production_ready_products_mesure` (`product_id`, `measurement_name`, `size_value`, `measurement_value`, `tolerance`, `notes`) VALUES
-- Tour de poitrine for different sizes
(6, 'Tour de poitrine', 'S', 88.0, 1.0, 'Mesure standard homme - Taille S'),
(6, 'Tour de poitrine', 'M', 92.0, 1.0, 'Mesure standard homme - Taille M'),
(6, 'Tour de poitrine', 'L', 96.0, 1.0, 'Mesure standard homme - Taille L'),
(6, 'Tour de poitrine', 'XL', 100.0, 1.0, 'Mesure standard homme - Taille XL'),
(6, 'Tour de poitrine', 'XXL', 104.0, 1.0, 'Mesure standard homme - Taille XXL'),

-- Tour de taille for different sizes
(6, 'Tour de taille', 'S', 74.0, 0.5, 'Au niveau du nombril - Taille S'),
(6, 'Tour de taille', 'M', 78.0, 0.5, 'Au niveau du nombril - Taille M'),
(6, 'Tour de taille', 'L', 82.0, 0.5, 'Au niveau du nombril - Taille L'),
(6, 'Tour de taille', 'XL', 86.0, 0.5, 'Au niveau du nombril - Taille XL'),
(6, 'Tour de taille', 'XXL', 90.0, 0.5, 'Au niveau du nombril - Taille XXL'),

-- Longueur bras for different sizes
(6, 'Longueur bras', 'S', 63.0, 0.8, 'Épaule à poignet - Taille S'),
(6, 'Longueur bras', 'M', 65.0, 0.8, 'Épaule à poignet - Taille M'),
(6, 'Longueur bras', 'L', 67.0, 0.8, 'Épaule à poignet - Taille L'),
(6, 'Longueur bras', 'XL', 69.0, 0.8, 'Épaule à poignet - Taille XL'),
(6, 'Longueur bras', 'XXL', 71.0, 0.8, 'Épaule à poignet - Taille XXL');

-- Insert sample measurements with size support for soustraitance products
INSERT INTO `production_soustraitance_products_mesure` (`product_id`, `measurement_name`, `size_value`, `measurement_value`, `tolerance`, `notes`) VALUES
-- Tour de poitrine for different sizes
(3, 'Tour de poitrine', 'S', 90.0, 1.0, 'Mesure client spécifique - Taille S'),
(3, 'Tour de poitrine', 'M', 95.0, 1.0, 'Mesure client spécifique - Taille M'),
(3, 'Tour de poitrine', 'L', 100.0, 1.0, 'Mesure client spécifique - Taille L'),

-- Tour de taille for different sizes
(3, 'Tour de taille', 'S', 78.0, 0.5, 'Taille naturelle - Taille S'),
(3, 'Tour de taille', 'M', 82.5, 0.5, 'Taille naturelle - Taille M'),
(3, 'Tour de taille', 'L', 87.0, 0.5, 'Taille naturelle - Taille L'),

-- Hauteur for different sizes
(3, 'Hauteur', 'S', 170.0, 1.5, 'Taille totale debout - Taille S'),
(3, 'Hauteur', 'M', 175.0, 1.5, 'Taille totale debout - Taille M'),
(3, 'Hauteur', 'L', 180.0, 1.5, 'Taille totale debout - Taille L');