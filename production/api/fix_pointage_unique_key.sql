-- Fix unique key: allow multiple rows per employee per month (one per date)
ALTER TABLE `production_employe_pointage` 
  DROP KEY `uniq_employee_month`;

-- Add new unique key on employee_id + date instead
ALTER TABLE `production_employe_pointage` 
  ADD UNIQUE KEY `uniq_employee_date` (`employee_id`, `date`);
