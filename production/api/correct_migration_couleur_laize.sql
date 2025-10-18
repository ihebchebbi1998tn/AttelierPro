-- Fix the incorrect migration
-- Step 1: Clear the incorrectly migrated data where all three fields are the same

-- Clear laize where it incorrectly equals reference and couleur
UPDATE production_matieres 
SET laize = NULL 
WHERE reference = couleur AND couleur = laize AND reference IS NOT NULL;

-- Clear couleur where it incorrectly equals reference (this was the wrong copy)
UPDATE production_matieres 
SET couleur = NULL 
WHERE reference = couleur AND reference IS NOT NULL;

-- Step 2: You now need to restore the original couleur values
-- If you have original data, use it to restore couleur
-- For example, if you have a backup table:
-- UPDATE production_matieres p 
-- SET couleur = (SELECT original_couleur FROM backup_table b WHERE b.id = p.id)
-- WHERE p.couleur IS NULL;

-- Step 3: Once couleur is restored with original values, run the correct migration:
-- UPDATE production_matieres 
-- SET laize = couleur 
-- WHERE couleur IS NOT NULL;

-- Step 4: Then set couleur to reference values:
-- UPDATE production_matieres 
-- SET couleur = reference 
-- WHERE reference IS NOT NULL;