-- Create table for batch status change history
CREATE TABLE IF NOT EXISTS batch_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_batch_id (batch_id),
    INDEX idx_changed_at (changed_at),
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE
);

-- Insert initial status for existing batches
INSERT INTO batch_status_history (batch_id, old_status, new_status, changed_by, changed_at, comments)
SELECT 
    id as batch_id,
    NULL as old_status,
    status as new_status,
    'System Migration' as changed_by,
    created_at as changed_at,
    'Initial status from batch creation' as comments
FROM production_batches
WHERE id NOT IN (SELECT DISTINCT batch_id FROM batch_status_history);