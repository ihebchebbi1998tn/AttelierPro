-- Migration: create production_employe_pointage table
CREATE TABLE IF NOT EXISTS `production_employe_pointage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `month` varchar(64) NOT NULL,
  `jr_travaille_count` int NOT NULL DEFAULT 0,
  `absent_count` int NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_id` (`employee_id`),
  UNIQUE KEY `uniq_employee_month` (`employee_id`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Optional: FK to employees (uncomment if you want enforcement)
-- ALTER TABLE `production_employe_pointage`
--   ADD CONSTRAINT `fk_pointage_employee` FOREIGN KEY (`employee_id`) REFERENCES `production_employees` (`id`) ON DELETE CASCADE;
