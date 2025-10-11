-- Add production_specifications column to production_ready_products table
-- This will store dynamic specifications like materials, buttons, finishing details, etc.
ALTER TABLE production_ready_products 
ADD COLUMN production_specifications JSON DEFAULT NULL COMMENT 'Dynamic specifications like {"Matériau principal": "Coton 100%", "Nombre de boutons": "6", "Type de fermeture": "Éclair invisible"}';
