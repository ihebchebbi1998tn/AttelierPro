-- Migration: Add all Excel import columns to production_employe_pointage table
ALTER TABLE `production_employe_pointage`
  ADD COLUMN `emp_no` varchar(50) DEFAULT NULL AFTER `employee_id`,
  ADD COLUMN `matricule` varchar(50) DEFAULT NULL AFTER `emp_no`,
  ADD COLUMN `prenom` varchar(100) DEFAULT NULL AFTER `matricule`,
  ADD COLUMN `nom` varchar(100) DEFAULT NULL AFTER `prenom`,
  ADD COLUMN `jr_repos` varchar(50) DEFAULT NULL AFTER `nom`,
  ADD COLUMN `date` date DEFAULT NULL AFTER `jr_repos`,
  ADD COLUMN `horaire` varchar(100) DEFAULT NULL AFTER `date`,
  ADD COLUMN `debut` time DEFAULT NULL AFTER `horaire`,
  ADD COLUMN `fin` time DEFAULT NULL AFTER `debut`,
  ADD COLUMN `entree` time DEFAULT NULL AFTER `fin`,
  ADD COLUMN `sortie` time DEFAULT NULL AFTER `entree`,
  ADD COLUMN `jr_normalement_trv` decimal(10,2) DEFAULT 0 AFTER `sortie`,
  ADD COLUMN `jr_travaille` decimal(10,2) DEFAULT 0 AFTER `jr_normalement_trv`,
  ADD COLUMN `retard` decimal(10,2) DEFAULT 0 AFTER `jr_travaille`,
  ADD COLUMN `depart_anticipe` decimal(10,2) DEFAULT 0 AFTER `retard`,
  ADD COLUMN `absent` decimal(10,2) DEFAULT 0 AFTER `depart_anticipe`,
  ADD COLUMN `h_sup` decimal(10,2) DEFAULT 0 AFTER `absent`,
  ADD COLUMN `presence_planning` varchar(50) DEFAULT NULL AFTER `h_sup`,
  ADD COLUMN `motif` text DEFAULT NULL AFTER `presence_planning`,
  ADD COLUMN `ptg_entree_obligatoire` varchar(50) DEFAULT NULL AFTER `motif`,
  ADD COLUMN `ptg_sortie_obligatoire` varchar(50) DEFAULT NULL AFTER `ptg_entree_obligatoire`,
  ADD COLUMN `departement` varchar(100) DEFAULT NULL AFTER `ptg_sortie_obligatoire`,
  ADD COLUMN `ndays` decimal(10,2) DEFAULT 0 AFTER `departement`,
  ADD COLUMN `weekend` decimal(10,2) DEFAULT 0 AFTER `ndays`,
  ADD COLUMN `holiday` decimal(10,2) DEFAULT 0 AFTER `weekend`,
  ADD COLUMN `presence_reelle` varchar(50) DEFAULT NULL AFTER `holiday`,
  ADD COLUMN `weekend_ot` decimal(10,2) DEFAULT 0 AFTER `presence_reelle`,
  ADD COLUMN `ndays_ot` decimal(10,2) DEFAULT 0 AFTER `weekend_ot`,
  ADD COLUMN `holiday_ot` decimal(10,2) DEFAULT 0 AFTER `ndays_ot`,
  ADD COLUMN `sspe_day_holiday_ot` decimal(10,2) DEFAULT 0 AFTER `holiday_ot`;

-- Add indexes for commonly queried columns
ALTER TABLE `production_employe_pointage`
  ADD KEY `idx_emp_no` (`emp_no`),
  ADD KEY `idx_matricule` (`matricule`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_departement` (`departement`);
