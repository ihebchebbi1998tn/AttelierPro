-- Fix absent column datatype to support fractional leave days
-- Current: tinyint(1) - only supports 0 or 1
-- Required: decimal(10,2) - supports 0.5 for half-day, hourly calculations

ALTER TABLE `production_employe_pointage`
  MODIFY COLUMN `absent` decimal(10,2) DEFAULT '0.00' COMMENT 'Days absent (supports fractional values for half-day/hourly leaves)';
