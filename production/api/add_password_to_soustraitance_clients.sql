-- Add password field to soustraitance clients table
ALTER TABLE `production_soustraitance_clients` 
ADD COLUMN `password` VARCHAR(255) DEFAULT NULL AFTER `website`,
ADD COLUMN `is_active` TINYINT(1) DEFAULT 1 AFTER `password`,
ADD COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL AFTER `is_active`;

-- Update existing clients with a default hashed password (password123)
-- You should ask clients to change this on first login
UPDATE `production_soustraitance_clients` 
SET `password` = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE `password` IS NULL;
