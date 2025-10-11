-- Add columns to production_batches table to support soustraitance production
ALTER TABLE `production_batches` 
ADD COLUMN `product_type` varchar(50) DEFAULT 'regular' COMMENT 'Type of product: regular or soustraitance',
ADD COLUMN `boutique_origin` varchar(255) DEFAULT NULL COMMENT 'For soustraitance: client name, for regular: boutique name';

-- Update existing records to have product_type = 'regular'
UPDATE `production_batches` SET `product_type` = 'regular' WHERE `product_type` IS NULL OR `product_type` = '';