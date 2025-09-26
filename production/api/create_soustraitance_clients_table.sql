CREATE TABLE IF NOT EXISTS `production_soustraitance_clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO `production_soustraitance_clients` (`name`, `email`, `phone`, `address`, `website`) VALUES
('Atelier Textile Moderne', 'contact@ateliermoderne.tn', '+216 71 234 567', '15 Avenue Habib Bourguiba, Tunis', 'https://ateliermoderne.tn'),
('Confection Premium', 'info@confectionpremium.com', '+216 72 345 678', '22 Rue de la République, Sfax', 'https://confectionpremium.com'),
('Textile Innovation', 'contact@textile-innovation.tn', '+216 73 456 789', '8 Boulevard du 14 Janvier, Sousse', NULL),
('Couture Élégance', 'hello@couture-elegance.tn', '+216 74 567 890', '45 Avenue Mohamed V, Monastir', 'https://couture-elegance.tn'),
('Manufacture Artisanale', 'contact@manufacture-artisanale.tn', '+216 75 678 901', '12 Rue des Artisans, Kairouan', NULL);