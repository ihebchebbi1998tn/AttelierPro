-- Create measurement tables for both regular products and soustraitance products

-- Table for regular products measurements (with FK to production_ready_products)
CREATE TABLE IF NOT EXISTS `production_ready_products_mesure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `measurement_name` varchar(255) NOT NULL,
  `measurement_value` decimal(5,2) DEFAULT NULL,
  `tolerance` decimal(3,2) DEFAULT 0.5 COMMENT 'Tolerance in cm',
  `unit` varchar(10) DEFAULT 'cm',
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_measurement_name` (`measurement_name`),
  CONSTRAINT `production_ready_products_mesure_ibfk_1`
    FOREIGN KEY (`product_id`) REFERENCES `production_ready_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for soustraitance products measurements (with FK to production_soustraitance_products)
CREATE TABLE IF NOT EXISTS `production_soustraitance_products_mesure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `measurement_name` varchar(255) NOT NULL,
  `measurement_value` decimal(5,2) DEFAULT NULL,
  `tolerance` decimal(3,2) DEFAULT 0.5 COMMENT 'Tolerance in cm',
  `unit` varchar(10) DEFAULT 'cm',
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_measurement_name` (`measurement_name`),
  CONSTRAINT `production_soustraitance_products_mesure_ibfk_1`
    FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample measurements for demo purposes
INSERT INTO `production_ready_products_mesure` (`product_id`, `measurement_name`, `measurement_value`, `tolerance`, `notes`) VALUES
(6, 'Tour de poitrine', 92.5, 1.0, 'Mesure standard homme'),
(6, 'Tour de taille', 78.0, 0.5, 'Au niveau du nombril'),
(6, 'Longueur bras', 65.2, 0.8, 'Épaule à poignet'),
(6, 'Tour de cou', 41.0, 0.3, 'Base du cou');

INSERT INTO `production_soustraitance_products_mesure` (`product_id`, `measurement_name`, `measurement_value`, `tolerance`, `notes`) VALUES
(3, 'Tour de poitrine', 95.0, 1.0, 'Mesure client spécifique'),
(3, 'Tour de taille', 82.5, 0.5, 'Taille naturelle'),
(3, 'Hauteur', 175.0, 1.5, 'Taille totale debout');