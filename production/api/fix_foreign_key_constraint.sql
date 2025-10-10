-- Fix foreign key constraint for production_batches to support both regular and soustraitance products
-- Since we cannot have conditional foreign keys in MySQL, we'll remove the strict constraint

-- Drop the existing foreign key constraint
ALTER TABLE `production_batches` 
DROP FOREIGN KEY `production_batches_ibfk_1`;

-- We won't add it back since we need to support both product tables:
-- - production_ready_products (for regular products) 
-- - production_soustraitance_products (for soustraitance products)

-- The application logic will handle the referential integrity
-- based on the product_type column ('regular' or 'soustraitance')