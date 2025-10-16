-- Add laize column to production_matieres table
ALTER TABLE `production_matieres` 
ADD COLUMN `laize` VARCHAR(100) NULL 
COMMENT 'Laize du matériau (largeur utilisable)' 
AFTER `taille`;

-- Add index for better performance on laize queries
CREATE INDEX `idx_laize` ON `production_matieres` (`laize`);