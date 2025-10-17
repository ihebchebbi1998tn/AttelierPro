-- Migration: Add leave tracking fields to production_employe_pointage table
-- This allows tracking leaves directly in pointage for accurate jr_travaille/absent calculation

ALTER TABLE `production_employe_pointage`
  ADD COLUMN `leave_type` ENUM('annual', 'sick', 'special', 'unpaid', 'maternity', 'paternity', 'other') DEFAULT NULL AFTER `motif`,
  ADD COLUMN `leave_duration` ENUM('FULL', 'AM', 'PM', 'HOURS') DEFAULT NULL AFTER `leave_type`,
  ADD COLUMN `leave_hours` DECIMAL(5,2) DEFAULT NULL COMMENT 'Number of leave hours if leave_duration is HOURS' AFTER `leave_duration`,
  ADD COLUMN `leave_status` ENUM('pending', 'approved', 'rejected') DEFAULT NULL AFTER `leave_hours`,
  ADD COLUMN `is_paid_leave` TINYINT(1) DEFAULT 1 COMMENT 'Whether leave is paid or unpaid' AFTER `leave_status`;

-- Add indexes for leave queries
ALTER TABLE `production_employe_pointage`
  ADD KEY `idx_leave_status` (`leave_status`),
  ADD KEY `idx_leave_type` (`leave_type`);

-- Note: When leave_type is set:
-- - If leave_duration = 'FULL': jr_travaille should be 0, absent should be 1 (or jr_normalement_trv value)
-- - If leave_duration = 'AM' or 'PM': jr_travaille should be 0.5, absent should be 0.5
-- - If leave_duration = 'HOURS': calculate based on leave_hours (e.g., 4 hours out of 8 = 0.5 day)
