-- Add new fields to production_holidays table for enhanced leave management
-- Adds support for: time ranges, date periods, and paid/unpaid leave

ALTER TABLE production_holidays
ADD COLUMN date_end DATE NULL AFTER date,
ADD COLUMN start_time TIME NULL AFTER half_day,
ADD COLUMN end_time TIME NULL AFTER start_time,
ADD COLUMN is_paid BOOLEAN DEFAULT TRUE AFTER status;

-- Add comment to document the enhancements
ALTER TABLE production_holidays COMMENT = 'Enhanced leave management with time ranges, periods, and paid/unpaid status';
