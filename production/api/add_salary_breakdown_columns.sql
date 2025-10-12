-- Add detailed salary breakdown columns for Tunisian payroll (2025)
ALTER TABLE production_salaries 
ADD COLUMN IF NOT EXISTS salaire_brut DECIMAL(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cnss DECIMAL(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS salaire_brut_imposable DECIMAL(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS irpp DECIMAL(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS css DECIMAL(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS salaire_net DECIMAL(10,3) DEFAULT 0;

-- Rename old columns for backward compatibility
-- net_total will be used for salaire_net
-- brut_total will be used for salaire_brut
-- taxes will be deprecated but kept for historical data

-- Add index for faster queries
ALTER TABLE production_salaries
ADD INDEX idx_employee_effective (employee_id, effective_from);
