-- Create soustraitance stock table
CREATE TABLE IF NOT EXISTS `production_soustraitance_stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `size_name` varchar(10) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `reserved_quantity` int(11) DEFAULT NULL,
  `minimum_threshold` int(11) DEFAULT 5,
  `maximum_capacity` int(11) DEFAULT 1000,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_size` (`product_id`, `size_name`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_size_name` (`size_name`),
  KEY `idx_stock_quantity` (`stock_quantity`),
  FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create stock history table for tracking changes
CREATE TABLE IF NOT EXISTS `production_soustraitance_stock_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stock_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `size_name` varchar(10) NOT NULL,
  `old_quantity` int(11) DEFAULT 0,
  `new_quantity` int(11) DEFAULT 0,
  `change_type` enum('ADD','REMOVE','ADJUST','RESERVE','RELEASE') NOT NULL,
  `change_reason` varchar(255) DEFAULT NULL,
  `changed_by` varchar(100) DEFAULT NULL,
  `change_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stock_id` (`stock_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_change_date` (`change_date`),
  FOREIGN KEY (`stock_id`) REFERENCES `production_soustraitance_stock` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;