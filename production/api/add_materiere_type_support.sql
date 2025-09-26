-- Add materiere_type and extern_customer_id columns to production_matieres table

ALTER TABLE `production_matieres` 
ADD COLUMN `materiere_type` ENUM('intern', 'extern') DEFAULT 'intern' COMMENT 'Type de matière: intern (notre matière) ou extern (matière client)' AFTER `other_attributes`,
ADD COLUMN `extern_customer_id` INT NULL COMMENT 'ID du client externe si materiere_type = extern' AFTER `materiere_type`;

-- Add index for better performance
CREATE INDEX `idx_materiere_type` ON `production_matieres` (`materiere_type`);
CREATE INDEX `idx_extern_customer` ON `production_matieres` (`extern_customer_id`);

-- Add foreign key constraint if clients table exists
-- ALTER TABLE `production_matieres` 
-- ADD CONSTRAINT `fk_extern_customer` 
-- FOREIGN KEY (`extern_customer_id`) REFERENCES `production_clients_externes` (`id`) 
-- ON DELETE SET NULL ON UPDATE CASCADE;