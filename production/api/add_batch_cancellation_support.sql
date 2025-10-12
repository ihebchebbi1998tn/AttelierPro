-- Add cancellation support to production_batches table
ALTER TABLE production_batches 
ADD COLUMN cancelled_at TIMESTAMP NULL AFTER completed_at,
ADD COLUMN cancelled_by INT NULL AFTER cancelled_at,
ADD COLUMN cancellation_reason TEXT NULL AFTER cancelled_by,
ADD FOREIGN KEY (cancelled_by) REFERENCES production_utilisateurs(id) ON DELETE SET NULL;

-- Update status enum to include cancelled (if using enum, otherwise this is handled in application logic)
-- Note: If status is stored as VARCHAR, no ALTER needed as we'll handle 'cancelled' in application code