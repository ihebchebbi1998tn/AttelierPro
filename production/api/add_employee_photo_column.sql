-- Add photo column to production_employees table
ALTER TABLE production_employees 
ADD COLUMN photo VARCHAR(255) NULL AFTER actif;

-- Create uploads directory structure (manual step required)
-- mkdir -p ../uploads/employees/
-- chmod 777 ../uploads/employees/
