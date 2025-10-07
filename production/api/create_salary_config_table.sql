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

-- Insert default configuration values (2025 Tunisia)
INSERT INTO production_salary_config (config_key, config_value, description) VALUES
('cnss_rate', 0.0968, 'CNSS rate (9.18% + 0.5% FOPROLOS)'),
('css_rate', 0.0100, 'CSS - Contribution Sociale de Solidarité (1%)'),
('deduction_chef_famille', 150.000, 'Monthly tax deduction for head of household (TND)'),
('deduction_per_child', 100.000, 'Monthly tax deduction per child (TND)')
ON DUPLICATE KEY UPDATE 
  config_value = VALUES(config_value),
  description = VALUES(description);

-- Insert default tax brackets (2025 monthly brackets)
INSERT INTO production_tax_brackets (bracket_order, min_amount, max_amount, tax_rate, description, active) VALUES
(1, 0.000, 416.660, 0.0000, 'Tranche 1: 0 - 416.66 TND (0%)', 1),
(2, 416.670, 1666.660, 0.2600, 'Tranche 2: 416.67 - 1,666.66 TND (26%)', 1),
(3, 1666.670, 2500.000, 0.2800, 'Tranche 3: 1,666.67 - 2,500 TND (28%)', 1),
(4, 2500.010, 4166.660, 0.3200, 'Tranche 4: 2,500.01 - 4,166.66 TND (32%)', 1),
(5, 4166.670, NULL, 0.3500, 'Tranche 5: > 4,166.67 TND (35%)', 1)
ON DUPLICATE KEY UPDATE 
  min_amount = VALUES(min_amount),
  max_amount = VALUES(max_amount),
  tax_rate = VALUES(tax_rate),
  description = VALUES(description);
