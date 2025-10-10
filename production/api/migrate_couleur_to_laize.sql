-- Migration script to move couleur data to laize and copy reference to couleur
-- This script will:
-- 1. Move existing couleur data to laize column
-- 2. Copy reference data to couleur column

-- First, let's backup the current data structure (optional but recommended)
-- CREATE TABLE production_matieres_backup AS SELECT * FROM production_matieres;

-- Update the data: move couleur to laize and copy reference to couleur
UPDATE production_matieres 
SET 
    laize = couleur,
    couleur = reference
WHERE 
    couleur IS NOT NULL OR reference IS NOT NULL;

-- Optional: Show summary of changes
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT(CASE WHEN laize IS NOT NULL THEN 1 END) as records_with_laize,
--     COUNT(CASE WHEN couleur IS NOT NULL THEN 1 END) as records_with_couleur,
--     COUNT(CASE WHEN reference IS NOT NULL THEN 1 END) as records_with_reference
-- FROM production_matieres;