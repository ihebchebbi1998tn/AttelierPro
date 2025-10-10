-- Add deduction tracking field to production_surmesure_matieres table
ALTER TABLE `production_surmesure_matieres` 
ADD COLUMN `stock_deducted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Track if stock has been deducted for this material' AFTER `commentaire`;

-- Add index for better performance on deduction queries
CREATE INDEX `idx_stock_deducted` ON `production_surmesure_matieres` (`stock_deducted`);

-- Add index for compound queries
CREATE INDEX `idx_commande_deducted` ON `production_surmesure_matieres` (`commande_id`, `stock_deducted`);