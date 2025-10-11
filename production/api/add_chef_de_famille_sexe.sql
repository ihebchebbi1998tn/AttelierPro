-- Add chef_de_famille and sexe columns to production_employees table
ALTER TABLE production_employees 
ADD COLUMN IF NOT EXISTS chef_de_famille BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sexe ENUM('homme','femme') DEFAULT NULL;

-- Add index for faster queries
ALTER TABLE production_employees
ADD INDEX IF NOT EXISTS idx_sexe (sexe);
