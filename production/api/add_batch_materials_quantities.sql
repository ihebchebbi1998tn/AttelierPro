-- Add materials_quantities column to production_batches table
-- This stores the actual quantities used for each material as JSON
-- Format: {"material_id": quantity, "material_id": quantity, ...}

ALTER TABLE production_batches 
ADD COLUMN materials_quantities JSON DEFAULT NULL COMMENT 'Actual quantities used for each material, key is material_id';
