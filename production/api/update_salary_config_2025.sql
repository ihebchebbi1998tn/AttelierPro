-- Migration script to update salary configuration to 2025 Loi de Finances values
-- Run this script on existing databases to update to the correct 2025 values

-- Update CSS rate from 1% to 0.5%
UPDATE production_salary_config 
SET config_value = 0.005, 
    description = 'CSS - Contribution Sociale de Solidarité (0.5%)'
WHERE config_key = 'css_rate';

-- Update Chef de famille deduction from 150 TND to 300 TND
UPDATE production_salary_config 
SET config_value = 300.000, 
    description = 'Monthly tax deduction for head of household (TND) - 2025'
WHERE config_key = 'deduction_chef_famille';

-- Deactivate old tax brackets
UPDATE production_tax_brackets SET active = 0;

-- Insert correct 2025 tax brackets (monthly values from annual barème ÷ 12)
INSERT INTO production_tax_brackets (bracket_order, min_amount, max_amount, tax_rate, description, active) VALUES
(1, 0.000, 416.667, 0.0000, 'Tranche 1: 0 - 416.67 TND (0%) - Annual: 0-5,000', 1),
(2, 416.667, 833.333, 0.1500, 'Tranche 2: 416.67 - 833.33 TND (15%) - Annual: 5,000-10,000', 1),
(3, 833.333, 1666.667, 0.2500, 'Tranche 3: 833.33 - 1,666.67 TND (25%) - Annual: 10,000-20,000', 1),
(4, 1666.667, 2500.000, 0.3000, 'Tranche 4: 1,666.67 - 2,500 TND (30%) - Annual: 20,000-30,000', 1),
(5, 2500.000, 3333.333, 0.3300, 'Tranche 5: 2,500 - 3,333.33 TND (33%) - Annual: 30,000-40,000', 1),
(6, 3333.333, 4166.667, 0.3600, 'Tranche 6: 3,333.33 - 4,166.67 TND (36%) - Annual: 40,000-50,000', 1),
(7, 4166.667, 5833.333, 0.3800, 'Tranche 7: 4,166.67 - 5,833.33 TND (38%) - Annual: 50,000-70,000', 1),
(8, 5833.333, NULL, 0.4000, 'Tranche 8: > 5,833.33 TND (40%) - Annual: > 70,000', 1);
