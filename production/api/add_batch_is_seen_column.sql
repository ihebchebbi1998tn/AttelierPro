-- Add is_seen column to production_batches table
-- This allows tracking which batches have been seen by production managers

ALTER TABLE `production_batches`
ADD COLUMN `is_seen` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Whether the batch has been seen by admin (0=not seen, 1=seen)' AFTER `production_specifications`;

-- Add index for better query performance on unseen batches
ALTER TABLE `production_batches`
ADD INDEX `idx_is_seen_status` (`is_seen`, `status`);

-- Add index for created_at + is_seen for efficient ordering
ALTER TABLE `production_batches`
ADD INDEX `idx_created_is_seen` (`created_at`, `is_seen`);
