-- Script de création des tables pour la Gestion RH
-- À exécuter dans la base de données luccybcdb

-- Table employés
CREATE TABLE IF NOT EXISTS production_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(30),
  adresse TEXT,
  region VARCHAR(100),
  statut_civil ENUM('celibataire','marie','divorce','veuf','autre') DEFAULT 'autre',
  actif TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table templates d'horaires hebdomadaires
CREATE TABLE IF NOT EXISTS production_shift_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  weekday TINYINT NOT NULL, -- 0 = Dimanche, 1 = Lundi, ... 6 = Samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lunch_start TIME DEFAULT NULL,
  lunch_end TIME DEFAULT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES production_employees(id) ON DELETE CASCADE,
  INDEX idx_employee_weekday (employee_id, weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table plannings spécifiques (par date)
CREATE TABLE IF NOT EXISTS production_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  is_half_day TINYINT(1) DEFAULT 0,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES production_employees(id) ON DELETE CASCADE,
  UNIQUE KEY uk_emp_date (employee_id, date),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table congés / absences
CREATE TABLE IF NOT EXISTS production_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  half_day ENUM('AM','PM','FULL') DEFAULT 'FULL',
  motif VARCHAR(255),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_by INT DEFAULT NULL,
  approved_by INT DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES production_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES production_employees(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES production_employees(id) ON DELETE SET NULL,
  INDEX idx_employee_date (employee_id, date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table salaires
CREATE TABLE IF NOT EXISTS production_salaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  net_total DECIMAL(12,2) NOT NULL,
  brut_total DECIMAL(12,2),
  taxes DECIMAL(12,2),
  effective_from DATE NOT NULL,
  effective_to DATE DEFAULT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES production_employees(id) ON DELETE CASCADE,
  INDEX idx_employee_effective (employee_id, effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table entrées de temps / pointage
CREATE TABLE IF NOT EXISTS production_time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  lunch_start TIME,
  lunch_end TIME,
  total_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES production_employees(id) ON DELETE CASCADE,
  UNIQUE KEY uk_emp_date_entry (employee_id, date),
  INDEX idx_date_entry (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table configuration RH
CREATE TABLE IF NOT EXISTS production_rh_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertion des configurations par défaut
INSERT IGNORE INTO production_rh_config (config_key, config_value, description) VALUES
('default_work_hours', '8', 'Nombre d\'heures de travail par défaut par jour'),
('default_lunch_duration', '60', 'Durée de pause déjeuner par défaut en minutes'),
('default_work_start', '09:00', 'Heure de début de travail par défaut'),
('default_work_end', '17:00', 'Heure de fin de travail par défaut'),
('company_name', 'Lucci by EY', 'Nom de l\'entreprise');