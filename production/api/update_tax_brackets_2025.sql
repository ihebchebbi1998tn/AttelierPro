-- Update tax brackets to 2025 new values
-- Based on Loi de Finances 2025 - Annual brackets converted to monthly

-- First, deactivate all existing brackets
UPDATE production_tax_brackets SET active = 0 WHERE active = 1;

-- Delete old brackets to start fresh
DELETE FROM production_tax_brackets;

-- Insert new 2025 tax brackets (monthly amounts)
INSERT INTO production_tax_brackets (bracket_order, min_amount, max_amount, tax_rate, description, active) VALUES
(1, 0.000, 416.667, 0.0000, 'Tranche 1: 0 - 416.67 TND (0%) - Annuel: 0-5,000 DT', 1),
(2, 416.667, 833.333, 0.1500, 'Tranche 2: 416.67 - 833.33 TND (15%) - Annuel: 5,000-10,000 DT', 1),
(3, 833.333, 1666.667, 0.2500, 'Tranche 3: 833.33 - 1,666.67 TND (25%) - Annuel: 10,000-20,000 DT', 1),
(4, 1666.667, 2500.000, 0.3000, 'Tranche 4: 1,666.67 - 2,500 TND (30%) - Annuel: 20,000-30,000 DT', 1),
(5, 2500.000, 3333.333, 0.3300, 'Tranche 5: 2,500 - 3,333.33 TND (33%) - Annuel: 30,000-40,000 DT', 1),
(6, 3333.333, 4166.667, 0.3600, 'Tranche 6: 3,333.33 - 4,166.67 TND (36%) - Annuel: 40,000-50,000 DT', 1),
(7, 4166.667, 5833.333, 0.3800, 'Tranche 7: 4,166.67 - 5,833.33 TND (38%) - Annuel: 50,000-70,000 DT', 1),
(8, 5833.333, NULL, 0.4000, 'Tranche 8: > 5,833.33 TND (40%) - Annuel: > 70,000 DT', 1);
