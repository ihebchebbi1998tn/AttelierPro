-- Add description column to production_images table
ALTER TABLE `production_images` ADD COLUMN `description` TEXT NULL AFTER `upload_date`;