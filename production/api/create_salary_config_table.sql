-- Create table for salary calculation configuration
CREATE TABLE IF NOT EXISTS production_salary_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(50) NOT NULL UNIQUE,
  config_value DECIMAL(10,4) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table for tax brackets (progressive taxation)
CREATE TABLE IF NOT EXISTS production_tax_brackets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bracket_order INT NOT NULL,
  min_amount DECIMAL(10,3) NOT NULL,
  max_amount DECIMAL(10,3),
  tax_rate DECIMAL(5,4) NOT NULL,
  description VARCHAR(100),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active),
  INDEX idx_bracket_order (bracket_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration values (2025 Tunisia - Loi de Finances 2025)
INSERT INTO production_salary_config (config_key, config_value, description) VALUES
('cnss_rate', 0.0968, 'CNSS rate (9.18% + 0.5% FOPROLOS)'),
('css_rate', 0.0050, 'CSS - Contribution Sociale de Solidarité (0.5%)'),
('deduction_chef_famille', 300.000, 'Monthly tax deduction for head of household (TND) - 2025'),
('deduction_per_child', 100.000, 'Monthly tax deduction per child (TND)')
ON DUPLICATE KEY UPDATE 
  config_value = VALUES(config_value),
  description = VALUES(description);

-- Insert default tax brackets (2025 Loi de Finances - monthly brackets from annual barème ÷ 12)
INSERT INTO production_tax_brackets (bracket_order, min_amount, max_amount, tax_rate, description, active) VALUES
(1, 0.000, 416.667, 0.0000, 'Tranche 1: 0 - 416.67 TND (0%) - Annual: 0-5,000', 1),
(2, 416.667, 833.333, 0.1500, 'Tranche 2: 416.67 - 833.33 TND (15%) - Annual: 5,000-10,000', 1),
(3, 833.333, 1666.667, 0.2500, 'Tranche 3: 833.33 - 1,666.67 TND (25%) - Annual: 10,000-20,000', 1),
(4, 1666.667, 2500.000, 0.3000, 'Tranche 4: 1,666.67 - 2,500 TND (30%) - Annual: 20,000-30,000', 1),
(5, 2500.000, 3333.333, 0.3300, 'Tranche 5: 2,500 - 3,333.33 TND (33%) - Annual: 30,000-40,000', 1),
(6, 3333.333, 4166.667, 0.3600, 'Tranche 6: 3,333.33 - 4,166.67 TND (36%) - Annual: 40,000-50,000', 1),
(7, 4166.667, 5833.333, 0.3800, 'Tranche 7: 4,166.67 - 5,833.33 TND (38%) - Annual: 50,000-70,000', 1),
(8, 5833.333, NULL, 0.4000, 'Tranche 8: > 5,833.33 TND (40%) - Annual: > 70,000', 1)
ON DUPLICATE KEY UPDATE 
  min_amount = VALUES(min_amount),
  max_amount = VALUES(max_amount),
  tax_rate = VALUES(tax_rate),
  description = VALUES(description);
