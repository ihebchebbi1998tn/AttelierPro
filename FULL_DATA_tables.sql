
-
-- Table structure for table `productions_batches_images`
--

CREATE TABLE `productions_batches_images` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `image_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `uploaded_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productions_products_lucci`
--

CREATE TABLE `productions_products_lucci` (
  `id` int NOT NULL,
  `external_product_id` varchar(50) NOT NULL,
  `reference_product` varchar(255) DEFAULT NULL,
  `nom_product` varchar(255) NOT NULL,
  `img_product` text,
  `img2_product` text,
  `img3_product` text,
  `img4_product` text,
  `img5_product` text,
  `description_product` text,
  `type_product` varchar(100) DEFAULT NULL,
  `category_product` varchar(100) DEFAULT NULL,
  `itemgroup_product` varchar(100) DEFAULT NULL,
  `price_product` decimal(10,2) DEFAULT NULL,
  `qnty_product` int DEFAULT '0',
  `color_product` varchar(100) DEFAULT NULL,
  `collection_product` varchar(100) DEFAULT NULL,
  `status_product` varchar(50) DEFAULT 'active',
  `discount_product` decimal(10,2) DEFAULT '0.00',
  `AutoReapprovisionnement` tinyint(1) DEFAULT '0',
  `AutoReapprovisionnement_quantity` int DEFAULT '0',
  `AutoReapprovisionnement_quantity_sizes` text,
  `createdate_product` datetime DEFAULT NULL,
  `xs_size` int DEFAULT '0',
  `s_size` int DEFAULT '0',
  `m_size` int DEFAULT '0',
  `l_size` int DEFAULT '0',
  `xl_size` int DEFAULT '0',
  `xxl_size` int DEFAULT '0',
  `3xl_size` int DEFAULT '0',
  `4xl_size` int DEFAULT '0',
  `30_size` int DEFAULT '0',
  `31_size` int DEFAULT '0',
  `32_size` int DEFAULT '0',
  `33_size` int DEFAULT '0',
  `34_size` int DEFAULT '0',
  `36_size` int DEFAULT '0',
  `38_size` int DEFAULT '0',
  `39_size` int DEFAULT '0',
  `40_size` int DEFAULT '0',
  `41_size` int DEFAULT '0',
  `42_size` int DEFAULT '0',
  `43_size` int DEFAULT '0',
  `44_size` int DEFAULT '0',
  `45_size` int DEFAULT '0',
  `46_size` int DEFAULT '0',
  `47_size` int DEFAULT '0',
  `48_size` int DEFAULT '0',
  `50_size` int DEFAULT '0',
  `52_size` int DEFAULT '0',
  `54_size` int DEFAULT '0',
  `56_size` int DEFAULT '0',
  `58_size` int DEFAULT '0',
  `60_size` int DEFAULT '0',
  `62_size` int DEFAULT '0',
  `64_size` int DEFAULT '0',
  `66_size` int DEFAULT '0',
  `85_size` int DEFAULT '0',
  `90_size` int DEFAULT '0',
  `95_size` int DEFAULT '0',
  `100_size` int DEFAULT '0',
  `105_size` int DEFAULT '0',
  `110_size` int DEFAULT '0',
  `115_size` int DEFAULT '0',
  `120_size` int DEFAULT '0',
  `125_size` int DEFAULT '0',
  `boutique_origin` varchar(50) DEFAULT 'luccibyey',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productions_products_spada`
--

CREATE TABLE `productions_products_spada` (
  `id` int NOT NULL,
  `external_product_id` varchar(50) NOT NULL,
  `reference_product` varchar(255) DEFAULT NULL,
  `nom_product` varchar(255) NOT NULL,
  `img_product` text,
  `img2_product` text,
  `img3_product` text,
  `img4_product` text,
  `img5_product` text,
  `description_product` text,
  `type_product` varchar(100) DEFAULT NULL,
  `category_product` varchar(100) DEFAULT NULL,
  `itemgroup_product` varchar(100) DEFAULT NULL,
  `price_product` decimal(10,2) DEFAULT NULL,
  `qnty_product` int DEFAULT '0',
  `color_product` varchar(100) DEFAULT NULL,
  `collection_product` varchar(100) DEFAULT NULL,
  `status_product` varchar(50) DEFAULT 'active',
  `discount_product` decimal(10,2) DEFAULT '0.00',
  `AutoReapprovisionnement` tinyint(1) DEFAULT '0',
  `AutoReapprovisionnement_quantity` int DEFAULT '0',
  `AutoReapprovisionnement_quantity_sizes` text,
  `createdate_product` datetime DEFAULT NULL,
  `xs_size` int DEFAULT '0',
  `s_size` int DEFAULT '0',
  `m_size` int DEFAULT '0',
  `l_size` int DEFAULT '0',
  `xl_size` int DEFAULT '0',
  `xxl_size` int DEFAULT '0',
  `3xl_size` int DEFAULT '0',
  `4xl_size` int DEFAULT '0',
  `30_size` int DEFAULT '0',
  `31_size` int DEFAULT '0',
  `32_size` int DEFAULT '0',
  `33_size` int DEFAULT '0',
  `34_size` int DEFAULT '0',
  `36_size` int DEFAULT '0',
  `38_size` int DEFAULT '0',
  `39_size` int DEFAULT '0',
  `40_size` int DEFAULT '0',
  `41_size` int DEFAULT '0',
  `42_size` int DEFAULT '0',
  `43_size` int DEFAULT '0',
  `44_size` int DEFAULT '0',
  `45_size` int DEFAULT '0',
  `46_size` int DEFAULT '0',
  `47_size` int DEFAULT '0',
  `48_size` int DEFAULT '0',
  `50_size` int DEFAULT '0',
  `52_size` int DEFAULT '0',
  `54_size` int DEFAULT '0',
  `56_size` int DEFAULT '0',
  `58_size` int DEFAULT '0',
  `60_size` int DEFAULT '0',
  `62_size` int DEFAULT '0',
  `64_size` int DEFAULT '0',
  `66_size` int DEFAULT '0',
  `85_size` int DEFAULT '0',
  `90_size` int DEFAULT '0',
  `95_size` int DEFAULT '0',
  `100_size` int DEFAULT '0',
  `105_size` int DEFAULT '0',
  `110_size` int DEFAULT '0',
  `115_size` int DEFAULT '0',
  `120_size` int DEFAULT '0',
  `125_size` int DEFAULT '0',
  `boutique_origin` varchar(50) DEFAULT 'spadadibattaglia',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_batches`
--

CREATE TABLE `production_batches` (
  `id` int NOT NULL,
  `batch_reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int NOT NULL,
  `quantity_to_produce` int NOT NULL,
  `sizes_breakdown` text COLLATE utf8mb4_unicode_ci,
  `status` enum('planifie','en_cours','termine','a_collecter','en_magasin') COLLATE utf8mb4_unicode_ci DEFAULT 'planifie',
  `total_materials_cost` decimal(12,2) DEFAULT '0.00',
  `notification_emails` text COLLATE utf8mb4_unicode_ci,
  `started_by` int DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` int DEFAULT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `product_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'regular' COMMENT 'Type: regular or soustraitance',
  `boutique_origin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Client name for soustraitance, boutique for regular'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_batch_attachments`
--

CREATE TABLE `production_batch_attachments` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `description` text,
  `uploaded_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_batch_materials`
--

CREATE TABLE `production_batch_materials` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity_used` decimal(10,3) NOT NULL,
  `quantity_type_id` int NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT '0.00',
  `total_cost` decimal(12,2) DEFAULT '0.00',
  `transaction_id` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_batch_notes`
--

CREATE TABLE `production_batch_notes` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `note_text` text NOT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_clients`
--

CREATE TABLE `production_clients` (
  `client_id` int NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_clients_externes`
--

CREATE TABLE `production_clients_externes` (
  `external_client_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_commandes_fichiers`
--

CREATE TABLE `production_commandes_fichiers` (
  `file_id` int NOT NULL,
  `order_id` int NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_user` int NOT NULL,
  `upload_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_commandes_mesures`
--

CREATE TABLE `production_commandes_mesures` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `chest` decimal(5,2) NOT NULL,
  `waist` decimal(5,2) NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `other` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_commandes_surmesure`
--

CREATE TABLE `production_commandes_surmesure` (
  `order_id` int NOT NULL,
  `client_id` int NOT NULL,
  `delivery_date` date NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `other_attributes` json DEFAULT NULL,
  `created_user` int NOT NULL,
  `modified_user` int NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_employees`
--

CREATE TABLE `production_employees` (
  `id` int NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `adresse` text,
  `region` varchar(100) DEFAULT NULL,
  `statut_civil` enum('celibataire','marie','divorce','veuf','autre') DEFAULT 'autre',
  `actif` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_holidays`
--

CREATE TABLE `production_holidays` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `half_day` enum('AM','PM','FULL') DEFAULT 'FULL',
  `motif` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_images`
--

CREATE TABLE `production_images` (
  `image_id` int NOT NULL,
  `related_type` enum('produit','matiere','commande') COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_id` int NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_user` int NOT NULL,
  `upload_date` datetime NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_materials_fournisseurs`
--

CREATE TABLE `production_materials_fournisseurs` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_matieres`
--

CREATE TABLE `production_matieres` (
  `id` int NOT NULL,
  `nom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int DEFAULT NULL,
  `quantity_type_id` int NOT NULL,
  `quantite_stock` decimal(10,3) DEFAULT '0.000',
  `quantite_min` decimal(10,3) DEFAULT '0.000',
  `quantite_max` decimal(10,3) DEFAULT '0.000',
  `prix_unitaire` decimal(10,2) DEFAULT '0.00',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `couleur` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taille` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `laize` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Laize du matériau (largeur utilisable)',
  `fournisseur` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_fournisseur` int DEFAULT NULL,
  `date_achat` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `other_attributes` text COLLATE utf8mb4_unicode_ci,
  `materiere_type` enum('intern','extern') COLLATE utf8mb4_unicode_ci DEFAULT 'intern' COMMENT 'Type de matière: intern (notre matière) ou extern (matière client)',
  `extern_customer_id` int DEFAULT NULL COMMENT 'ID du client externe si materiere_type = extern'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_matieres_category`
--

CREATE TABLE `production_matieres_category` (
  `id` int NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#6B7280',
  `active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_products_attachments`
--

CREATE TABLE `production_products_attachments` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `description` text,
  `uploaded_by` varchar(100) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_product_materials`
--

CREATE TABLE `production_product_materials` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity_needed` decimal(10,3) NOT NULL,
  `quantity_type_id` int NOT NULL,
  `size_specific` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_produits`
--

CREATE TABLE `production_produits` (
  `product_id` int NOT NULL,
  `reference` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `other_attributes` json DEFAULT NULL,
  `created_user` int NOT NULL,
  `modified_user` int NOT NULL,
  `created_date` datetime NOT NULL,
  `modified_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_produits_externes`
--

CREATE TABLE `production_produits_externes` (
  `external_product_id` int NOT NULL,
  `external_client_id` int NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_produit_matieres`
--

CREATE TABLE `production_produit_matieres` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity_needed` decimal(10,2) NOT NULL,
  `size` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_quantity_types`
--

CREATE TABLE `production_quantity_types` (
  `id` int NOT NULL,
  `nom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unite` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_ready_products`
--

CREATE TABLE `production_ready_products` (
  `id` int NOT NULL,
  `boutique_origin` enum('luccibyey','spadadibattaglia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_product_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_product` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_product` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img2_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img3_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img4_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img5_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description_product` text COLLATE utf8mb4_unicode_ci,
  `type_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `itemgroup_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_product` decimal(10,2) DEFAULT NULL,
  `qnty_product` int DEFAULT '0',
  `color_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection_product` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_product` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `auto_replenishment` tinyint(1) DEFAULT '0',
  `auto_replenishment_quantity` int DEFAULT '0',
  `auto_replenishment_quantity_sizes` text COLLATE utf8mb4_unicode_ci,
  `sizes_data` text COLLATE utf8mb4_unicode_ci,
  `discount_product` decimal(10,2) DEFAULT '0.00',
  `related_products` text COLLATE utf8mb4_unicode_ci,
  `createdate_product` datetime DEFAULT NULL,
  `s_size` int DEFAULT '0',
  `m_size` int DEFAULT '0',
  `l_size` int DEFAULT '0',
  `xl_size` int DEFAULT '0',
  `xxl_size` int DEFAULT '0',
  `3xl_size` int DEFAULT '0',
  `4xl_size` int DEFAULT '0',
  `xs_size` int DEFAULT '0',
  `30_size` int DEFAULT '0',
  `31_size` int DEFAULT '0',
  `32_size` int DEFAULT '0',
  `33_size` int DEFAULT '0',
  `34_size` int DEFAULT '0',
  `36_size` int DEFAULT '0',
  `38_size` int DEFAULT '0',
  `39_size` int DEFAULT '0',
  `40_size` int DEFAULT '0',
  `41_size` int DEFAULT '0',
  `42_size` int DEFAULT '0',
  `43_size` int DEFAULT '0',
  `44_size` int DEFAULT '0',
  `45_size` int DEFAULT '0',
  `46_size` int DEFAULT '0',
  `47_size` int DEFAULT '0',
  `48_size` int DEFAULT '0',
  `50_size` int DEFAULT '0',
  `52_size` int DEFAULT '0',
  `54_size` int DEFAULT '0',
  `56_size` int DEFAULT '0',
  `58_size` int DEFAULT '0',
  `60_size` int DEFAULT '0',
  `62_size` int DEFAULT '0',
  `64_size` int DEFAULT '0',
  `66_size` int DEFAULT '0',
  `85_size` int DEFAULT '0',
  `90_size` int DEFAULT '0',
  `95_size` int DEFAULT '0',
  `100_size` int DEFAULT '0',
  `105_size` int DEFAULT '0',
  `110_size` int DEFAULT '0',
  `115_size` int DEFAULT '0',
  `120_size` int DEFAULT '0',
  `125_size` int DEFAULT '0',
  `materials_configured` tinyint(1) DEFAULT '0',
  `sync_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_ready_products_mesure`
--

CREATE TABLE `production_ready_products_mesure` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `measurement_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_value` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Size like S, M, L, XL, or numeric sizes',
  `measurement_value` decimal(6,2) DEFAULT NULL COMMENT 'Measurement value for this size',
  `tolerance` decimal(3,2) DEFAULT '0.50' COMMENT 'Tolerance in cm',
  `unit` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'cm',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_rh_config`
--

CREATE TABLE `production_rh_config` (
  `id` int NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_salaries`
--

CREATE TABLE `production_salaries` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `net_total` decimal(12,2) NOT NULL,
  `brut_total` decimal(12,2) DEFAULT NULL,
  `taxes` decimal(12,2) DEFAULT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_schedules`
--

CREATE TABLE `production_schedules` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `lunch_start` time DEFAULT NULL,
  `lunch_end` time DEFAULT NULL,
  `is_half_day` tinyint(1) DEFAULT '0',
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_shift_templates`
--

CREATE TABLE `production_shift_templates` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `weekday` tinyint NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `lunch_start` time DEFAULT NULL,
  `lunch_end` time DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_clients`
--

CREATE TABLE `production_soustraitance_clients` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_clients_files`
--

CREATE TABLE `production_soustraitance_clients_files` (
  `file_id` int NOT NULL,
  `client_id` int NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_user` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upload_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_products`
--

CREATE TABLE `production_soustraitance_products` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `boutique_origin` varchar(50) DEFAULT 'soustraitance',
  `external_product_id` varchar(100) DEFAULT NULL,
  `reference_product` varchar(100) DEFAULT NULL,
  `nom_product` varchar(255) NOT NULL,
  `img_product` varchar(500) DEFAULT NULL,
  `img2_product` varchar(500) DEFAULT NULL,
  `img3_product` varchar(500) DEFAULT NULL,
  `img4_product` varchar(500) DEFAULT NULL,
  `img5_product` varchar(500) DEFAULT NULL,
  `description_product` text,
  `type_product` varchar(100) DEFAULT NULL,
  `category_product` varchar(100) DEFAULT NULL,
  `itemgroup_product` varchar(100) DEFAULT NULL,
  `price_product` decimal(10,2) DEFAULT '0.00',
  `qnty_product` int DEFAULT '0',
  `color_product` varchar(100) DEFAULT NULL,
  `collection_product` varchar(100) DEFAULT NULL,
  `status_product` varchar(50) DEFAULT 'active',
  `auto_replenishment` tinyint(1) DEFAULT '0',
  `auto_replenishment_quantity` int DEFAULT '0',
  `auto_replenishment_quantity_sizes` json DEFAULT NULL,
  `sizes_data` json DEFAULT NULL,
  `discount_product` decimal(5,2) DEFAULT '0.00',
  `related_products` text,
  `createdate_product` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `size_xs` int DEFAULT '0',
  `size_s` int DEFAULT '0',
  `size_m` int DEFAULT '0',
  `size_l` int DEFAULT '0',
  `size_xl` int DEFAULT '0',
  `size_xxl` int DEFAULT '0',
  `size_3xl` int DEFAULT '0',
  `size_4xl` int DEFAULT '0',
  `size_30` int DEFAULT '0',
  `size_31` int DEFAULT '0',
  `size_32` int DEFAULT '0',
  `size_33` int DEFAULT '0',
  `size_34` int DEFAULT '0',
  `size_36` int DEFAULT '0',
  `size_38` int DEFAULT '0',
  `size_39` int DEFAULT '0',
  `size_40` int DEFAULT '0',
  `size_41` int DEFAULT '0',
  `size_42` int DEFAULT '0',
  `size_43` int DEFAULT '0',
  `size_44` int DEFAULT '0',
  `size_45` int DEFAULT '0',
  `size_46` int DEFAULT '0',
  `size_47` int DEFAULT '0',
  `size_48` int DEFAULT '0',
  `size_50` int DEFAULT '0',
  `size_52` int DEFAULT '0',
  `size_54` int DEFAULT '0',
  `size_56` int DEFAULT '0',
  `size_58` int DEFAULT '0',
  `size_60` int DEFAULT '0',
  `size_62` int DEFAULT '0',
  `size_64` int DEFAULT '0',
  `size_66` int DEFAULT '0',
  `size_85` int DEFAULT '0',
  `size_90` int DEFAULT '0',
  `size_95` int DEFAULT '0',
  `size_100` int DEFAULT '0',
  `size_105` int DEFAULT '0',
  `size_110` int DEFAULT '0',
  `size_115` int DEFAULT '0',
  `size_120` int DEFAULT '0',
  `size_125` int DEFAULT '0',
  `no_size` tinyint(1) DEFAULT '0' COMMENT 'Product has no specific sizes (accessories, etc.)',
  `materials_configured` tinyint(1) DEFAULT '0',
  `sync_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_products_files`
--

CREATE TABLE `production_soustraitance_products_files` (
  `file_id` int NOT NULL,
  `product_id` int NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_user` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_products_mesure`
--

CREATE TABLE `production_soustraitance_products_mesure` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `measurement_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_value` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Size like S, M, L, XL, or numeric sizes',
  `measurement_value` decimal(6,2) DEFAULT NULL COMMENT 'Measurement value for this size',
  `tolerance` decimal(3,2) DEFAULT '0.50' COMMENT 'Tolerance in cm',
  `unit` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'cm',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_product_materials`
--

CREATE TABLE `production_soustraitance_product_materials` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity_needed` decimal(10,3) NOT NULL,
  `quantity_type_id` int NOT NULL,
  `size_specific` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_stock`
--

CREATE TABLE `production_soustraitance_stock` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `size_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_quantity` int DEFAULT '0',
  `reserved_quantity` int DEFAULT NULL,
  `minimum_threshold` int DEFAULT '5',
  `maximum_capacity` int DEFAULT '1000',
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_soustraitance_stock_history`
--

CREATE TABLE `production_soustraitance_stock_history` (
  `id` int NOT NULL,
  `stock_id` int NOT NULL,
  `product_id` int NOT NULL,
  `size_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_quantity` int DEFAULT '0',
  `new_quantity` int DEFAULT '0',
  `change_type` enum('ADD','REMOVE','ADJUST','RESERVE','RELEASE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `change_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_surmesure_commandes`
--

CREATE TABLE `production_surmesure_commandes` (
  `id` int NOT NULL,
  `client_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_vorname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_region` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ready_date` date NOT NULL,
  `first_try_date` date NOT NULL,
  `second_try_date` date DEFAULT NULL,
  `third_try_date` date DEFAULT NULL,
  `status` enum('new','in_progress','ready_for_pickup','ready_for_pickup','first_try','needs_revision','ready_for_second_try','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'new',
  `measurements` json NOT NULL COMMENT 'Dynamic measurements as JSON object',
  `tolerance` json NOT NULL COMMENT 'Dynamic tolerance values as JSON object',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `first_try_completed_at` datetime DEFAULT NULL COMMENT 'Actual completion datetime of first try',
  `second_try_completed_at` datetime DEFAULT NULL COMMENT 'Actual completion datetime of second try',
  `third_try_completed_at` datetime DEFAULT NULL COMMENT 'Actual completion datetime of third try',
  `first_try_scheduled_time` time DEFAULT NULL COMMENT 'Scheduled time for first try',
  `second_try_scheduled_time` time DEFAULT NULL COMMENT 'Scheduled time for second try',
  `third_try_scheduled_time` time DEFAULT NULL COMMENT 'Scheduled time for third try',
  `is_seen` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the order has been seen by admin (0=not seen, 1=seen)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `production_surmesure_commandes`
--
DELIMITER $$
CREATE TRIGGER `validate_measurements_json` BEFORE INSERT ON `production_surmesure_commandes` FOR EACH ROW BEGIN
    -- Ensure measurements is a valid JSON object
    IF JSON_TYPE(NEW.measurements) != 'OBJECT' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Measurements must be a valid JSON object';
    END IF;
    
    -- Ensure tolerance is a valid JSON object
    IF JSON_TYPE(NEW.tolerance) != 'OBJECT' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Tolerance must be a valid JSON object';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validate_measurements_json_update` BEFORE UPDATE ON `production_surmesure_commandes` FOR EACH ROW BEGIN
    -- Ensure measurements is a valid JSON object
    IF JSON_TYPE(NEW.measurements) != 'OBJECT' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Measurements must be a valid JSON object';
    END IF;
    
    -- Ensure tolerance is a valid JSON object
    IF JSON_TYPE(NEW.tolerance) != 'OBJECT' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Tolerance must be a valid JSON object';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `production_surmesure_commentaires`
--

CREATE TABLE `production_surmesure_commentaires` (
  `id` int NOT NULL,
  `commande_id` int NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Lucci Boutique' COMMENT 'Who created the comment',
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_surmesure_images`
--

CREATE TABLE `production_surmesure_images` (
  `id` int NOT NULL,
  `commande_id` int NOT NULL,
  `image_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_surmesure_matieres`
--

CREATE TABLE `production_surmesure_matieres` (
  `id` int NOT NULL,
  `commande_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity_needed` decimal(10,3) NOT NULL DEFAULT '0.000',
  `quantity_type_id` int NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `stock_deducted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Track if stock has been deducted for this material',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_surmesure_optionfinition`
--

CREATE TABLE `production_surmesure_optionfinition` (
  `id` int NOT NULL,
  `commande_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(500) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_surmesure_videos`
--

CREATE TABLE `production_surmesure_videos` (
  `id` int NOT NULL,
  `commande_id` int NOT NULL,
  `video_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `file_size` bigint DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_sync_log`
--

CREATE TABLE `production_sync_log` (
  `id` int NOT NULL,
  `boutique` enum('luccibyey','spadadibattaglia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sync_type` enum('manual','automatic') COLLATE utf8mb4_unicode_ci DEFAULT 'manual',
  `products_found` int DEFAULT '0',
  `products_added` int DEFAULT '0',
  `products_updated` int DEFAULT '0',
  `status` enum('success','error','partial') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sync_duration` int DEFAULT NULL,
  `started_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_time_entries`
--

CREATE TABLE `production_time_entries` (
  `id` int NOT NULL,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `clock_in` time DEFAULT NULL,
  `clock_out` time DEFAULT NULL,
  `lunch_start` time DEFAULT NULL,
  `lunch_end` time DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `overtime_hours` decimal(5,2) DEFAULT '0.00',
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_transactions_stock`
--

CREATE TABLE `production_transactions_stock` (
  `transaction_id` bigint NOT NULL,
  `material_id` int NOT NULL,
  `type_mouvement` enum('in','out','adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` decimal(10,3) NOT NULL,
  `quantity_type_id` int NOT NULL,
  `prix_unitaire` decimal(10,2) DEFAULT '0.00',
  `cout_total` decimal(12,2) DEFAULT '0.00',
  `motif` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_commande` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `user_id` int DEFAULT NULL,
  `date_transaction` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_utilisateurs`
--

CREATE TABLE `production_utilisateurs` (
  `id` int NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','production_manager','operator') COLLATE utf8mb4_unicode_ci DEFAULT 'operator',
  `active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_videos`
--

CREATE TABLE `production_videos` (
  `video_id` int NOT NULL,
  `order_id` int NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_user` int NOT NULL,
  `upload_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
