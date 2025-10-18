-- Create tables for size configuration history and transfer batches

-- Create transfer batches table to group and track transfers
CREATE TABLE IF NOT EXISTS product_transfer_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    boutique_origin VARCHAR(100) NOT NULL,
    external_product_id VARCHAR(100) NOT NULL,
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_quantity INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_boutique_external (boutique_origin, external_product_id),
    INDEX idx_transfer_date (transfer_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create size configuration history table
CREATE TABLE IF NOT EXISTS product_size_configuration_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    transfer_batch_id INT,
    size_type VARCHAR(50) NOT NULL,
    size_value VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    action_type ENUM('initial', 'added', 'updated', 'preserved') NOT NULL,
    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_quantity INT DEFAULT 0,
    INDEX idx_product_id (product_id),
    INDEX idx_transfer_batch (transfer_batch_id),
    INDEX idx_size_config (product_id, size_type, size_value),
    INDEX idx_configured_at (configured_at),
    FOREIGN KEY (transfer_batch_id) REFERENCES product_transfer_batches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns to production_ready_products for better tracking (ignore errors if columns exist)
ALTER TABLE production_ready_products ADD COLUMN last_transfer_batch_id INT DEFAULT NULL;
ALTER TABLE production_ready_products ADD COLUMN size_configuration_version INT DEFAULT 1;
ALTER TABLE production_ready_products ADD COLUMN total_configured_quantity INT DEFAULT 0;

-- Add foreign key constraint (ignore error if constraint exists)
ALTER TABLE production_ready_products 
ADD CONSTRAINT fk_last_transfer_batch 
FOREIGN KEY (last_transfer_batch_id) REFERENCES product_transfer_batches(id) ON DELETE SET NULL;