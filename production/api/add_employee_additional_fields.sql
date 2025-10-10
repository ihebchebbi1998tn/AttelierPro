-- Add additional employee fields
ALTER TABLE production_employees 
ADD COLUMN IF NOT EXISTS carte_identite VARCHAR(50),
ADD COLUMN IF NOT EXISTS sexe ENUM('homme','femme') DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cnss_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS nombre_enfants INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- Add index for faster queries on date_naissance
ALTER TABLE production_employees
ADD INDEX idx_date_naissance (date_naissance);
