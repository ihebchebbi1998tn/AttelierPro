-- Add is_active column to production_ready_products for soft delete functionality
-- This preserves historical production data instead of hard deleting records

ALTER TABLE `production_ready_products` 
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Soft delete flag: 1=active, 0=deleted/archived' 
AFTER `is_in_production`;

-- Add index for better query performance
ALTER TABLE `production_ready_products` 
ADD INDEX `idx_is_active` (`is_active`);

-- Add composite index for common query patterns
ALTER TABLE `production_ready_products` 
ADD INDEX `idx_active_in_production` (`is_active`, `is_in_production`);
