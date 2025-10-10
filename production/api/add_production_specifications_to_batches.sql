-- Add production_specifications column to production_batches table
-- This will store specifications from the product when batch is created
ALTER TABLE production_batches 
ADD COLUMN production_specifications JSON DEFAULT NULL COMMENT 'Production specifications transferred from product';
