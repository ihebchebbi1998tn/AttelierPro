-- Table to store pre-configured specification templates
CREATE TABLE IF NOT EXISTS `specification_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Specification name (e.g., Matériaux, Boutons)',
  `input_type` enum('input','select','checkbox') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'input' COMMENT 'Type of input: free text, dropdown, or checkboxes',
  `options` json DEFAULT NULL COMMENT 'Array of options for select/checkbox types: ["Option 1", "Option 2"]',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Whether this template is active',
  `display_order` int DEFAULT '0' COMMENT 'Order in which templates appear',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_active_order` (`is_active`,`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
