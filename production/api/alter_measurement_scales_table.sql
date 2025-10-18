-- Add tolerance data to the measurement scales table
-- This will store tolerance/variance values for each measurement type
ALTER TABLE product_measurement_scales 
ADD COLUMN tolerance_data JSON DEFAULT NULL COMMENT 'Object with measurement_type as key and tolerance value as value like {"BACK width": 0.5, "Chest": 1.0}';