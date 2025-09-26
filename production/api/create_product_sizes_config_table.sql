-- Create product_sizes_config table to handle products with no sizes
CREATE TABLE IF NOT EXISTS product_sizes_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    no_sizes TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id)
);