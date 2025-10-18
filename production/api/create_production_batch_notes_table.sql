-- Create table for production batch notes
CREATE TABLE IF NOT EXISTS production_batch_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    note_text TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_batch_id (batch_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE
);