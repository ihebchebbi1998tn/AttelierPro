-- Add role and age columns to production_employees table
ALTER TABLE production_employees 
ADD COLUMN IF NOT EXISTS role VARCHAR(100),
ADD COLUMN IF NOT EXISTS age INT;
