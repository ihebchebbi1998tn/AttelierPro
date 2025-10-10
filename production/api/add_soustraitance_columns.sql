-- Add columns to support soustraitance products in production_batches
ALTER TABLE `production_batches` 
ADD COLUMN `product_type` VARCHAR(50) DEFAULT 'regular' COMMENT 'Type: regular or soustraitance',
ADD COLUMN `boutique_origin` VARCHAR(255) DEFAULT NULL COMMENT 'Client name for soustraitance, boutique for regular';

-- Update existing records
UPDATE `production_batches` 
SET `product_type` = 'regular' 
WHERE `product_type` IS NULL;

-- Update boutique_origin for existing regular products
UPDATE `production_batches` b
JOIN `production_ready_products` p ON b.product_id = p.id
SET b.boutique_origin = p.boutique_origin
WHERE b.product_type = 'regular' AND b.boutique_origin IS NULL;