-- Migration: create_production_stock_transactions.sql
-- Purpose: Create the production_stock_transactions table that some API endpoints expect.
-- Review before running. Adjust types/constraints to match your DB conventions.

CREATE TABLE IF NOT EXISTS `production_stock_transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `matiere_id` INT UNSIGNED NOT NULL,
  `type_transaction` ENUM('in','out') NOT NULL DEFAULT 'in',
  `quantite` DECIMAL(12,3) NOT NULL DEFAULT 0,
  `commentaire` TEXT NULL,
  `utilisateur_id` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`matiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
