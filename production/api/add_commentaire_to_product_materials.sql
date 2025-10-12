-- Add commentaire column to production_product_materials table
ALTER TABLE `production_product_materials` 
ADD COLUMN `commentaire` TEXT DEFAULT NULL AFTER `notes`;
