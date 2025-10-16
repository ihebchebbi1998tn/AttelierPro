-- Add production quantities column to store size-specific production quantities
ALTER TABLE `production_ready_products` 
ADD COLUMN `production_quantities` TEXT DEFAULT NULL COMMENT 'JSON data for production quantities by size',
ADD COLUMN `is_in_production` TINYINT(1) DEFAULT 0 COMMENT 'Flag to track if product is currently in production',
ADD COLUMN `transferred_at` TIMESTAMP DEFAULT NULL COMMENT 'When product was transferred to production list';

-- Update the status enum to include a new status for products ready for production
ALTER TABLE `production_ready_products` 
MODIFY COLUMN `status_product` ENUM('active','inactive','awaiting_production','in_production') DEFAULT 'active';