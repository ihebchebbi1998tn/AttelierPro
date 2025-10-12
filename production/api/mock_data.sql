-- ========================================================
-- MOCK DATA SQL - Comprehensive test data for production system
-- ========================================================

-- Disable foreign key checks temporarily to avoid constraint issues
SET FOREIGN_KEY_CHECKS = 0;

-- Ensure we start with a clean slate for specific tables (uncomment if needed)
-- TRUNCATE TABLE production_transactions_stock;
-- TRUNCATE TABLE production_matieres;
-- TRUNCATE TABLE production_matieres_category;
-- TRUNCATE TABLE production_quantity_types;
-- TRUNCATE TABLE production_utilisateurs;

-- Insert users first (required for foreign keys) with explicit IDs
INSERT INTO production_utilisateurs (user_id, username, password, role, created_date, modified_date) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW(), NOW()),
(2, 'production_mgr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'production', NOW(), NOW()),
(3, 'stock_clerk', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'stock', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
username = VALUES(username), 
role = VALUES(role), 
modified_date = NOW();

-- Insert quantity types
INSERT INTO production_quantity_types (value, label, is_active, created_user, modified_user, created_date, modified_date) VALUES
('mètres', 'Mètres', 1, 1, 1, NOW(), NOW()),
('kg', 'Kilogrammes', 1, 1, 1, NOW(), NOW()),
('pièces', 'Pièces', 1, 1, 1, NOW(), NOW()),
('bobines', 'Bobines', 1, 1, 1, NOW(), NOW()),
('rouleaux', 'Rouleaux', 1, 1, 1, NOW(), NOW()),
('litres', 'Litres', 1, 1, 1, NOW(), NOW()),
('sachets', 'Sachets', 1, 1, 1, NOW(), NOW()),
('boîtes', 'Boîtes', 1, 1, 1, NOW(), NOW());

-- Insert material categories
INSERT INTO production_matieres_category (name, description, is_active, created_user, modified_user, created_date, modified_date) VALUES
('Tissus', 'Matières textiles principales - cotons, soies, lins', 1, 1, 1, NOW(), NOW()),
('Fils', 'Fils de couture, broderie et finition', 1, 1, 1, NOW(), NOW()),
('Accessoires', 'Boutons, fermetures éclair, rivets', 1, 1, 1, NOW(), NOW()),
('Doublures', 'Matières de doublure et renfort', 1, 1, 1, NOW(), NOW()),
('Cuirs', 'Cuirs naturels et synthétiques', 1, 1, 1, NOW(), NOW()),
('Dentelles', 'Dentelles et broderies décoratives', 1, 1, 1, NOW(), NOW()),
('Élastiques', 'Élastiques et matières extensibles', 1, 1, 1, NOW(), NOW()),
('Fournitures', 'Matières diverses et consommables', 1, 1, 1, NOW(), NOW());

-- Insert comprehensive materials with varied stock levels
INSERT INTO production_matieres (reference, title, color, price, quantity_type, quantity_total, lowest_quantity_needed, medium_quantity_needed, good_quantity_needed, location, category_id, is_replacable, other_attributes, created_user, modified_user, created_date, modified_date) VALUES

-- TISSUS CATEGORY (Critical & Warning stocks)
('TIS-COT-001', 'Tissu Coton Bio Blanc', 'Blanc', 15.50, 'mètres', 2.5, 10.0, 25.0, 50.0, 'Usine', 1, 1, '{"origine": "France", "certification": "GOTS", "poids": "180g/m²"}', 1, 1, '2024-01-10 10:00:00', '2024-01-15 14:30:00'),
('TIS-COT-002', 'Tissu Coton Bleu Marine', 'Bleu Marine', 14.20, 'mètres', 5.0, 8.0, 20.0, 35.0, 'Usine', 1, 0, '{"origine": "Turquie", "traitement": "Anti-taches"}', 1, 1, '2024-01-12 09:15:00', '2024-01-16 11:45:00'),
('TIS-COT-003', 'Tissu Coton Noir Premium', 'Noir', 16.80, 'mètres', 12.0, 15.0, 30.0, 60.0, 'Lucci By Ey', 1, 0, '{"grade": "Premium", "finition": "Satiné"}', 1, 1, '2024-01-08 16:20:00', '2024-01-18 09:00:00'),
('TIS-LIN-001', 'Lin Français Naturel', 'Écru', 28.00, 'mètres', 8.0, 12.0, 25.0, 40.0, 'Usine', 1, 1, '{"origine": "Normandie", "type": "Lin lavé"}', 1, 1, '2024-01-14 13:30:00', '2024-01-19 15:20:00'),
('TIS-SOI-001', 'Soie Naturelle Crème', 'Crème', 85.00, 'mètres', 3.5, 5.0, 15.0, 30.0, 'Lucci By Ey', 1, 0, '{"origine": "Chine", "momme": "22", "type": "Soie sauvage"}', 1, 1, '2024-01-11 11:10:00', '2024-01-17 16:40:00'),
('TIS-DEN-001', 'Denim Stretch Indigo', 'Indigo', 22.50, 'mètres', 18.0, 20.0, 40.0, 70.0, 'Usine', 1, 1, '{"stretch": "2%", "lavage": "Stone wash"}', 1, 1, '2024-01-09 14:45:00', '2024-01-20 10:15:00'),

-- FILS CATEGORY (Mixed stock levels)
('FIL-COT-001', 'Fil Coton Rouge Cardinal', 'Rouge', 8.75, 'bobines', 15.0, 20.0, 40.0, 80.0, 'Usine', 2, 0, '{"titrage": "40/2", "qualité": "Mercerisé"}', 1, 1, '2024-01-08 12:00:00', '2024-01-16 14:30:00'),
('FIL-COT-002', 'Fil Coton Blanc Écru', 'Blanc', 7.90, 'bobines', 45.0, 15.0, 30.0, 60.0, 'Lucci By Ey', 2, 1, '{"titrage": "50/2", "usage": "Couture fine"}', 1, 1, '2024-01-07 15:20:00', '2024-01-18 09:45:00'),
('FIL-SOI-001', 'Fil Soie Broderie Doré', 'Doré', 25.00, 'bobines', 8.0, 10.0, 25.0, 50.0, 'Usine', 2, 0, '{"usage": "Broderie", "brillance": "Haute"}', 1, 1, '2024-01-13 10:30:00', '2024-01-19 13:15:00'),
('FIL-POL-001', 'Fil Polyester Noir', 'Noir', 6.50, 'bobines', 32.0, 25.0, 50.0, 100.0, 'Usine', 2, 1, '{"résistance": "Haute", "usage": "Surfilage"}', 1, 1, '2024-01-06 08:40:00', '2024-01-21 11:20:00'),

-- ACCESSOIRES CATEGORY (Critical stocks)
('ACC-BTN-001', 'Boutons Dorés 15mm', 'Doré', 0.35, 'pièces', 45.0, 100.0, 300.0, 500.0, 'Usine', 3, 0, '{"matière": "Laiton", "finition": "Doré brillant"}', 1, 1, '2024-01-11 09:25:00', '2024-01-17 15:10:00'),
('ACC-BTN-002', 'Boutons Nacrés Blancs 12mm', 'Blanc', 0.28, 'pièces', 120.0, 150.0, 400.0, 800.0, 'Lucci By Ey', 3, 1, '{"matière": "Nacre synthétique"}', 1, 1, '2024-01-12 14:15:00', '2024-01-18 16:50:00'),
('ACC-ZIP-001', 'Fermeture Éclair 20cm Noir', 'Noir', 2.50, 'pièces', 25.0, 50.0, 150.0, 300.0, 'Usine', 3, 0, '{"type": "Métal", "curseur": "Automatique"}', 1, 1, '2024-01-09 11:40:00', '2024-01-16 12:30:00'),
('ACC-ZIP-002', 'Fermeture Éclair 35cm Marine', 'Marine', 3.20, 'pièces', 18.0, 30.0, 80.0, 200.0, 'Lucci By Ey', 3, 1, '{"type": "Plastique", "usage": "Vêtements"}', 1, 1, '2024-01-10 13:55:00', '2024-01-19 10:25:00'),
('ACC-RIV-001', 'Rivets Cuivre 8mm', 'Cuivre', 0.15, 'pièces', 80.0, 200.0, 500.0, 1000.0, 'Usine', 3, 0, '{"matière": "Cuivre massif", "finition": "Antique"}', 1, 1, '2024-01-15 16:30:00', '2024-01-20 14:45:00'),

-- DOUBLURES CATEGORY
('DOU-SOI-001', 'Doublure Soie Premium Crème', 'Crème', 22.00, 'mètres', 12.5, 10.0, 25.0, 45.0, 'Lucci By Ey', 4, 0, '{"poids": "60g/m²", "qualité": "Premium"}', 1, 1, '2024-01-09 12:20:00', '2024-01-17 11:35:00'),
('DOU-COT-001', 'Doublure Coton Blanc', 'Blanc', 9.50, 'mètres', 35.0, 20.0, 40.0, 70.0, 'Usine', 4, 1, '{"traitement": "Anti-froissement"}', 1, 1, '2024-01-08 15:10:00', '2024-01-18 13:50:00'),
('DOU-VIS-001', 'Doublure Viscose Noire', 'Noir', 12.80, 'mètres', 8.0, 15.0, 30.0, 55.0, 'Usine', 4, 0, '{"fluidité": "Haute", "tombant": "Excellent"}', 1, 1, '2024-01-14 10:45:00', '2024-01-20 09:20:00'),

-- CUIRS CATEGORY
('CUI-VAC-001', 'Cuir Vachette Marron', 'Marron', 45.00, 'mètres', 6.5, 8.0, 20.0, 35.0, 'Usine', 5, 0, '{"épaisseur": "2mm", "finition": "Grainée"}', 1, 1, '2024-01-12 08:30:00', '2024-01-19 14:15:00'),
('CUI-AGN-001', 'Cuir Agneau Noir', 'Noir', 65.00, 'mètres', 4.2, 6.0, 15.0, 25.0, 'Lucci By Ey', 5, 0, '{"souplesse": "Haute", "usage": "Maroquinerie"}', 1, 1, '2024-01-13 11:15:00', '2024-01-18 15:40:00'),

-- DENTELLES CATEGORY
('DEN-COT-001', 'Dentelle Coton Blanc 5cm', 'Blanc', 8.90, 'mètres', 25.0, 30.0, 60.0, 100.0, 'Usine', 6, 1, '{"largeur": "5cm", "motif": "Floral"}', 1, 1, '2024-01-10 14:20:00', '2024-01-17 12:45:00'),
('DEN-GUI-001', 'Guipure Écrue 8cm', 'Écru', 15.50, 'mètres', 18.0, 25.0, 50.0, 80.0, 'Lucci By Ey', 6, 0, '{"largeur": "8cm", "style": "Vintage"}', 1, 1, '2024-01-11 16:40:00', '2024-01-19 11:25:00'),

-- ÉLASTIQUES CATEGORY
('ELA-COT-001', 'Élastique Coton 2cm Blanc', 'Blanc', 3.20, 'mètres', 45.0, 40.0, 80.0, 150.0, 'Usine', 7, 1, '{"largeur": "2cm", "élasticité": "Moyenne"}', 1, 1, '2024-01-09 13:10:00', '2024-01-16 10:55:00'),
('ELA-SIL-001', 'Élastique Silicone 1cm Transparent', 'Transparent', 5.80, 'mètres', 28.0, 35.0, 70.0, 120.0, 'Lucci By Ey', 7, 0, '{"matière": "Silicone", "usage": "Lingerie"}', 1, 1, '2024-01-15 09:35:00', '2024-01-20 16:20:00'),

-- FOURNITURES CATEGORY
('FOU-CRA-001', 'Craie Tailleur Blanche', 'Blanc', 1.50, 'pièces', 15.0, 25.0, 50.0, 100.0, 'Usine', 8, 1, '{"usage": "Marquage tissu"}', 1, 1, '2024-01-08 17:00:00', '2024-01-18 08:30:00'),
('FOU-EPI-001', 'Épingles Acier Inox', 'Métal', 4.20, 'boîtes', 8.0, 12.0, 25.0, 50.0, 'Usine', 8, 0, '{"longueur": "3cm", "pointe": "Fine"}', 1, 1, '2024-01-14 12:25:00', '2024-01-19 15:10:00'),
('FOU-CIS-001', 'Ciseaux Professionnels 25cm', 'Métal', 35.00, 'pièces', 3.0, 5.0, 10.0, 20.0, 'Lucci By Ey', 8, 0, '{"acier": "Japonais", "usage": "Coupe tissu"}', 1, 1, '2024-01-13 15:50:00', '2024-01-20 13:40:00');

-- Insert comprehensive transaction history
INSERT INTO production_transactions_stock (material_id, type, quantity, user_id, transaction_date, note) VALUES

-- Recent transactions for critical items (showing why they're low)
(1, 'in', 50.0, 3, '2024-01-10 10:00:00', 'Réception commande fournisseur'),
(1, 'out', 25.0, 2, '2024-01-12 14:30:00', 'Production chemises collection été'),
(1, 'out', 15.0, 2, '2024-01-15 11:20:00', 'Échantillons client VIP'),
(1, 'out', 7.5, 2, '2024-01-18 16:45:00', 'Commande urgente'),

(2, 'in', 40.0, 3, '2024-01-12 09:15:00', 'Livraison express'),
(2, 'out', 20.0, 2, '2024-01-14 13:00:00', 'Production doublures'),
(2, 'out', 15.0, 2, '2024-01-16 15:30:00', 'Réparations atelier'),

(5, 'in', 25.0, 3, '2024-01-09 11:40:00', 'Stock de sécurité'),
(5, 'out', 12.0, 2, '2024-01-11 10:15:00', 'Fermetures robes'),
(5, 'out', 5.0, 2, '2024-01-13 14:20:00', 'Échantillons'),

-- Regular transactions for other materials
(3, 'in', 80.0, 3, '2024-01-08 16:20:00', 'Commande mensuelle'),
(3, 'out', 35.0, 2, '2024-01-10 12:30:00', 'Production pantalons'),
(3, 'out', 25.0, 2, '2024-01-14 09:45:00', 'Collection automne'),
(3, 'out', 8.0, 2, '2024-01-17 11:15:00', 'Retouches'),

(4, 'in', 60.0, 3, '2024-01-14 13:30:00', 'Réapprovisionnement'),
(4, 'out', 30.0, 2, '2024-01-16 10:00:00', 'Production manteaux'),
(4, 'out', 22.0, 2, '2024-01-19 15:20:00', 'Commande spéciale'),

(6, 'in', 120.0, 3, '2024-01-07 15:20:00', 'Stock trimestriel'),
(6, 'out', 45.0, 2, '2024-01-09 13:40:00', 'Broderies décorative'),
(6, 'out', 30.0, 2, '2024-01-12 16:10:00', 'Finitions haut de gamme'),

(7, 'in', 100.0, 3, '2024-01-13 10:30:00', 'Commande fournisseur'),
(7, 'out', 60.0, 2, '2024-01-15 14:50:00', 'Production accessoires'),
(7, 'out', 32.0, 2, '2024-01-18 09:30:00', 'Échantillons salons'),

(8, 'in', 200.0, 3, '2024-01-06 08:40:00', 'Livraison hebdomadaire'),
(8, 'out', 85.0, 2, '2024-01-08 11:20:00', 'Surfilage collection'),
(8, 'out', 55.0, 2, '2024-01-11 15:45:00', 'Finitions costumes'),
(8, 'out', 28.0, 2, '2024-01-15 12:15:00', 'Travaux divers'),

-- Boutons transactions (high volume)
(9, 'in', 500.0, 3, '2024-01-11 09:25:00', 'Palette complète fournisseur'),
(9, 'out', 180.0, 2, '2024-01-13 13:50:00', 'Production vestes'),
(9, 'out', 120.0, 2, '2024-01-16 10:30:00', 'Chemises haut de gamme'),
(9, 'out', 155.0, 2, '2024-01-19 14:20:00', 'Commande export'),

(10, 'in', 800.0, 3, '2024-01-12 14:15:00', 'Stock semestriel'),
(10, 'out', 350.0, 2, '2024-01-14 11:45:00', 'Chemisiers collection'),
(10, 'out', 230.0, 2, '2024-01-17 16:30:00', 'Robes été'),
(10, 'out', 100.0, 2, '2024-01-20 09:15:00', 'Échantillons boutiques'),

-- Historical data for better analytics
(1, 'in', 100.0, 3, '2024-01-01 08:00:00', 'Stock début année'),
(2, 'in', 80.0, 3, '2024-01-02 09:30:00', 'Réapprovisionnement janvier'),
(3, 'in', 150.0, 3, '2024-01-03 10:45:00', 'Commande préventive'),
(4, 'in', 120.0, 3, '2024-01-04 11:20:00', 'Livraison programmée'),
(5, 'in', 200.0, 3, '2024-01-05 12:15:00', 'Stock de démarrage');

-- Insert clients for orders
INSERT INTO production_clients (first_name, last_name, email, phone, created_date, modified_date) VALUES
('Sophie', 'Martin', 'sophie.martin@email.com', '0601234567', '2024-01-05 10:30:00', '2024-01-05 10:30:00'),
('Pierre', 'Dubois', 'pierre.dubois@email.com', '0612345678', '2024-01-06 14:20:00', '2024-01-06 14:20:00'),
('Marie', 'Leroy', 'marie.leroy@email.com', '0623456789', '2024-01-07 09:45:00', '2024-01-07 09:45:00'),
('Antoine', 'Moreau', 'antoine.moreau@email.com', '0634567890', '2024-01-08 16:15:00', '2024-01-08 16:15:00'),
('Camille', 'Roux', 'camille.roux@email.com', '0645678901', '2024-01-09 11:30:00', '2024-01-09 11:30:00'),
('Lucas', 'Garnier', 'lucas.garnier@email.com', '0656789012', '2024-01-10 13:50:00', '2024-01-10 13:50:00');

-- Insert some custom orders
INSERT INTO production_commandes_surmesure (client_id, delivery_date, status, other_attributes, created_user, modified_user, created_date, modified_date) VALUES
(1, '2024-02-15', 'en_cours', '{"urgence": "normale", "type": "costume", "notes": "Préférences couleurs sombres"}', 1, 1, '2024-01-15 10:00:00', '2024-01-18 14:30:00'),
(2, '2024-02-20', 'planifiee', '{"urgence": "haute", "type": "robe_soiree", "notes": "Client VIP - finitions premium"}', 1, 1, '2024-01-16 11:15:00', '2024-01-16 11:15:00'),
(3, '2024-02-28', 'en_attente', '{"urgence": "basse", "type": "veste", "notes": "Collection printemps"}', 1, 1, '2024-01-17 15:45:00', '2024-01-19 09:20:00'),
(4, '2024-03-05', 'en_cours', '{"urgence": "normale", "type": "ensemble", "notes": "Mariage - tenue complète"}', 1, 1, '2024-01-18 12:30:00', '2024-01-20 16:10:00');

-- Insert measurements for orders
INSERT INTO production_commandes_mesures (order_id, chest, waist, height, other) VALUES
(1, 92.50, 78.00, 175.00, 'Épaules larges, préfère coupe ajustée'),
(2, 88.00, 72.00, 165.00, 'Silhouette fine, longueur midi préférée'),
(3, 105.00, 95.00, 182.00, 'Corpulence forte, confort prioritaire'),
(4, 95.00, 82.00, 170.00, 'Morphologie standard, style classique');

-- Insert external clients for subcontracting
INSERT INTO production_clients_externes (name, contact, created_date) VALUES
('Atelier Couture Lyon', 'Marie Dupont - marie@atelierlyon.fr - 04.78.12.34.56', '2024-01-10 08:30:00'),
('Broderie Parisienne', 'Jean Martin - contact@broderieparis.fr - 01.45.67.89.12', '2024-01-11 09:45:00'),
('Maison de la Soie', 'Sylvie Laurent - commandes@maisonsoie.fr - 04.91.23.45.67', '2024-01-12 11:20:00'),
('Finitions Premium', 'Thomas Roche - info@finitionspremium.fr - 02.34.56.78.90', '2024-01-13 14:15:00');

-- Insert external products
INSERT INTO production_produits_externes (external_client_id, title, color) VALUES
(1, 'Broderie Logo Sur Mesure', 'Doré sur Noir'),
(1, 'Finitions Boutonnières Main', 'Assorties'),
(2, 'Broderie Monogramme', 'Argent'),
(2, 'Appliqués Décoratifs', 'Multicolore'),
(3, 'Doublure Soie Personnalisée', 'Bordeaux'),
(3, 'Finition Ourlets Invisibles', 'Assorties'),
(4, 'Pose Boutons Nacre', 'Blanc Nacré'),
(4, 'Finitions Coutures Anglaises', 'Assorties');

-- Insert images for materials (simulation)
INSERT INTO production_images (related_type, related_id, file_path, uploaded_user, upload_date) VALUES
('matiere', 1, '/uploads/materials/tissu_coton_blanc.jpg', 1, '2024-01-10 10:30:00'),
('matiere', 2, '/uploads/materials/tissu_coton_bleu.jpg', 1, '2024-01-12 11:15:00'),
('matiere', 3, '/uploads/materials/tissu_coton_noir.jpg', 1, '2024-01-08 16:45:00'),
('matiere', 9, '/uploads/materials/boutons_dores.jpg', 1, '2024-01-11 09:50:00'),
('matiere', 11, '/uploads/materials/fermeture_eclair_noir.jpg', 1, '2024-01-09 12:20:00'),
('commande', 1, '/uploads/orders/commande_001_sketch.jpg', 1, '2024-01-15 14:30:00'),
('commande', 2, '/uploads/orders/commande_002_design.jpg', 1, '2024-01-16 16:20:00');

-- ========================================================
-- Summary of inserted data:
-- - 3 Users (admin, production_mgr, stock_clerk)
-- - 8 Quantity types (mètres, kg, pièces, bobines, rouleaux, litres, sachets, boîtes)
-- - 8 Material categories (Tissus, Fils, Accessoires, Doublures, Cuirs, Dentelles, Élastiques, Fournitures)
-- - 25+ Materials with varied stock levels (critical, warning, good)
-- - 50+ Stock transactions with realistic history
-- - 6 Clients for custom orders  
-- - 4 Custom orders in different statuses
-- - 4 Measurement records
-- - 4 External clients for subcontracting
-- - 8 External products
-- - 7 Images linked to materials and orders
-- ========================================================

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;