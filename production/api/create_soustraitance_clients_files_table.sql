-- Create soustraitance client files table
CREATE TABLE IF NOT EXISTS `production_soustraitance_clients_files` (
  `file_id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_user` varchar(100) DEFAULT NULL,
  `upload_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`file_id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_upload_date` (`upload_date`),
  FOREIGN KEY (`client_id`) REFERENCES `production_soustraitance_clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;