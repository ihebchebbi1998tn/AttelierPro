-- Add support for products without sizes
-- This migration adds the ability to mark products as having no sizes

-- Add no_sizes column to track if a product type doesn't use sizes
ALTER TABLE `product_sizes_config` ADD COLUMN IF NOT EXISTS `no_sizes` tinyint(1) DEFAULT 0;

-- Add an index for better performance on no_sizes queries
CREATE INDEX IF NOT EXISTS `idx_no_sizes` ON `product_sizes_config` (`product_id`, `size_type`);

-- Comment: Products marked with size_type = 'no_sizes' indicate the product doesn't require size configuration
-- This is useful for products like wallets, accessories, gadgets, etc.