-- Set default value for transfer_date to automatically use current date
ALTER TABLE production_ready_products 
MODIFY COLUMN transfer_date DATE DEFAULT (CURDATE()) COMMENT 'Date when product was transferred to production (auto-set to today if null)';
