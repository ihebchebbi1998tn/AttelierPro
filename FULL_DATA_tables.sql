

CREATE TABLE `batch_status_history` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` varchar(100) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `comments` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_general_ci NOT NULL,
  `excerpt` text COLLATE utf8mb4_general_ci,
  `image_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `author` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Coach',
  `status` enum('published','draft') COLLATE utf8mb4_general_ci DEFAULT 'published',
  `reading_time` int DEFAULT '0',
  `views` int DEFAULT '0',
  `category` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Science',
  `tags` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id_message` int NOT NULL,
  `id_session` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_type` enum('client','agent') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_content` text COLLATE utf8mb4_unicode_ci,
  `message_type` enum('text','file','system','image') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `is_read` tinyint(1) DEFAULT '0',
  `date_sent` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_size` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id_session` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','closed','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `message_count` int DEFAULT '0',
  `unread_count` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id_customer` int NOT NULL,
  `nom_customer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom_customer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_customer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone_customer` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse_customer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville_customer` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_postal_customer` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pays_customer` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_creation_customer` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification_customer` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_addresses`
--

CREATE TABLE `delivery_addresses` (
  `id_delivery_address` int NOT NULL,
  `id_order` int NOT NULL,
  `nom_destinataire` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom_destinataire` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone_destinataire` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse_livraison` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ville_livraison` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_postal_livraison` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pays_livraison` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instructions_livraison` text COLLATE utf8mb4_unicode_ci,
  `date_creation_delivery` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emails`
--

CREATE TABLE `emails` (
  `id_email` int NOT NULL,
  `nom_client` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email_client` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `telephone_client` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `sujet_message` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `message_client` text COLLATE utf8mb4_general_ci NOT NULL,
  `vue_par_admin` tinyint(1) DEFAULT '0',
  `date_vue_admin` timestamp NULL DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fcm_tokens`
--

CREATE TABLE `fcm_tokens` (
  `id` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `user_type` enum('admin','client') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id_subscriber` int NOT NULL,
  `email_subscriber` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_subscriber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prenom_subscriber` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_subscriber` int DEFAULT NULL,
  `status_subscriber` enum('active','unsubscribed','bounced','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `source_subscriber` enum('website','checkout','social','manual','import','popup') COLLATE utf8mb4_unicode_ci DEFAULT 'website',
  `date_inscription` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_unsubscribe` timestamp NULL DEFAULT NULL,
  `ip_inscription` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_unsubscribe` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferences_subscriber` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON field for subscriber preferences'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id_order` int NOT NULL,
  `id_customer` int NOT NULL,
  `numero_commande` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sous_total_order` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount_order` decimal(10,2) DEFAULT '0.00',
  `discount_percentage_order` decimal(5,2) DEFAULT '0.00',
  `delivery_cost_order` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_order` decimal(10,2) NOT NULL,
  `status_order` enum('pending','confirmed','processing','shipped','delivered','cancelled','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `date_livraison_souhaitee` date DEFAULT NULL,
  `payment_link_konnekt` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes_order` text COLLATE utf8mb4_unicode_ci,
  `vue_par_admin` tinyint(1) DEFAULT '0' COMMENT 'Track if order has been viewed by admin (0 = not viewed, 1 = viewed)',
  `date_vue_admin` timestamp NULL DEFAULT NULL COMMENT 'Date when admin first viewed the order',
  `date_creation_order` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification_order` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `date_confirmation_order` timestamp NULL DEFAULT NULL,
  `date_livraison_order` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id_order_item` int NOT NULL,
  `id_order` int NOT NULL,
  `id_product` int NOT NULL,
  `nom_product_snapshot` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_product_snapshot` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_product_snapshot` decimal(10,2) NOT NULL,
  `size_selected` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_selected` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity_ordered` int NOT NULL DEFAULT '1',
  `subtotal_item` decimal(10,2) NOT NULL,
  `discount_item` decimal(10,2) DEFAULT '0.00',
  `total_item` decimal(10,2) NOT NULL,
  `date_creation_item` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_tracking`
--

CREATE TABLE `order_tracking` (
  `id_tracking` int NOT NULL,
  `id_order` int NOT NULL,
  `status_previous` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_new` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes_tracking` text COLLATE utf8mb4_unicode_ci,
  `date_tracking` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
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
  `boutique_origin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Client name for soustraitance, boutique for regular',
  `production_specifications` json DEFAULT NULL COMMENT 'Production specifications transferred from product',
  `is_seen` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the batch has been seen by admin (0=not seen, 1=seen)',
  `materials_quantities` json DEFAULT NULL COMMENT 'Actual quantities used for each material, key is material_id'
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
-- Table structure for table `production_batch_leftovers`
--

CREATE TABLE `production_batch_leftovers` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `material_id` int NOT NULL,
  `leftover_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_reusable` tinyint(1) DEFAULT '1' COMMENT 'Whether the leftover is reusable',
  `readded_to_stock` tinyint(1) DEFAULT '0' COMMENT 'Whether leftover was readded to stock',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `photo` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(100) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `carte_identite` varchar(50) DEFAULT NULL,
  `sexe` enum('homme','femme') DEFAULT NULL,
  `cnss_code` varchar(50) DEFAULT NULL,
  `nombre_enfants` int DEFAULT '0',
  `date_naissance` date DEFAULT NULL,
  `chef_de_famille` tinyint(1) DEFAULT '0'
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
  `status_product` enum('active','inactive','awaiting_production','in_production') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
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
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `production_quantities` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON data for production quantities by size',
  `is_in_production` tinyint(1) DEFAULT '0' COMMENT 'Flag to track if product is currently in production',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Soft delete flag: 1=active, 0=deleted/archived',
  `transferred_at` date DEFAULT NULL COMMENT 'Date when product was transferred to production list',
  `last_transfer_batch_id` int DEFAULT NULL,
  `size_configuration_version` int DEFAULT '1',
  `total_configured_quantity` int DEFAULT '0',
  `is_seen` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the transferred product has been seen by admin (0=not seen, 1=seen)',
  `transfer_date` date DEFAULT (curdate()) COMMENT 'Date when product was transferred to production (auto-set to today if null)',
  `production_specifications` json DEFAULT NULL COMMENT 'Dynamic specifications like {"Matériau principal": "Coton 100%", "Nombre de boutons": "6", "Type de fermeture": "Éclair invisible"}'
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
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `salaire_brut` decimal(10,3) DEFAULT '0.000',
  `cnss` decimal(10,3) DEFAULT '0.000',
  `salaire_brut_imposable` decimal(10,3) DEFAULT '0.000',
  `irpp` decimal(10,3) DEFAULT '0.000',
  `css` decimal(10,3) DEFAULT '0.000',
  `salaire_net` decimal(10,3) DEFAULT '0.000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_salary_config`
--

CREATE TABLE `production_salary_config` (
  `id` int NOT NULL,
  `config_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` decimal(10,4) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
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
  `is_confirmed` tinyint(1) DEFAULT '0',
  `measurements` json NOT NULL COMMENT 'Dynamic measurements as JSON object',
  `tolerance` json NOT NULL COMMENT 'Dynamic tolerance values as JSON object',
  `couple` json DEFAULT NULL COMMENT 'Store couple data as JSON object',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `first_try_completed_at` datetime DEFAULT NULL COMMENT 'Actual completion datetime of first try',
  `second_try_completed_at` datetime DEFAULT NULL COMMENT 'Actual completion datetime of second try',
  `third_try_completed_at` datetime DEFAULT NULL COMMENT 'Actual completion datetime of third try',
  `first_try_scheduled_time` time DEFAULT NULL COMMENT 'Scheduled time for first try',
  `second_try_scheduled_time` time DEFAULT NULL COMMENT 'Scheduled time for second try',
  `third_try_scheduled_time` time DEFAULT NULL COMMENT 'Scheduled time for third try',
  `is_seen` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether the order has been seen by admin (0=not seen, 1=seen)',
  `selected_matieres` json DEFAULT NULL COMMENT 'JSON array of selected matiere IDs for the order'
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
-- Table structure for table `production_tax_brackets`
--

CREATE TABLE `production_tax_brackets` (
  `id` int NOT NULL,
  `bracket_order` int NOT NULL,
  `min_amount` decimal(10,3) NOT NULL,
  `max_amount` decimal(10,3) DEFAULT NULL,
  `tax_rate` decimal(5,4) NOT NULL,
  `description` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id_product` int NOT NULL,
  `reference_product` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_product` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img2_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img3_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img4_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description_product` text COLLATE utf8mb4_unicode_ci,
  `type_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `itemgroup_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_product` decimal(10,2) NOT NULL,
  `qnty_product` int DEFAULT '0',
  `3xl_size` int DEFAULT '0',
  `s_size` int DEFAULT '0',
  `xs_size` int DEFAULT '0',
  `4xl_size` int DEFAULT '0',
  `m_size` int DEFAULT '0',
  `l_size` int DEFAULT '0',
  `xl_size` int DEFAULT '0',
  `xxl_size` int DEFAULT '0',
  `color_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection_product` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_product` enum('active','inactive','draft') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `related_products` text COLLATE utf8mb4_unicode_ci,
  `discount_product` decimal(5,2) DEFAULT '0.00',
  `AutoReapprovisionnement` tinyint(1) DEFAULT '0',
  `AutoReapprovisionnement_quantity` int DEFAULT '0',
  `AutoReapprovisionnement_quantity_sizes` json DEFAULT NULL,
  `createdate_product` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `39_size` int DEFAULT '0',
  `40_size` int DEFAULT '0',
  `85_size` int DEFAULT '0',
  `90_size` int DEFAULT '0',
  `95_size` int DEFAULT '0',
  `100_size` int DEFAULT '0',
  `105_size` int DEFAULT '0',
  `110_size` int DEFAULT '0',
  `115_size` int DEFAULT '0',
  `120_size` int DEFAULT '0',
  `125_size` int DEFAULT '0',
  `41_size` int DEFAULT '0',
  `42_size` int DEFAULT '0',
  `43_size` int DEFAULT '0',
  `44_size` int DEFAULT '0',
  `45_size` int DEFAULT '0',
  `46_size` int DEFAULT '0',
  `47_size` int DEFAULT '0',
  `img5_product` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `30_size` int DEFAULT '0',
  `31_size` int DEFAULT '0',
  `32_size` int DEFAULT '0',
  `33_size` int DEFAULT '0',
  `34_size` int DEFAULT '0',
  `36_size` int DEFAULT '0',
  `38_size` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_measurement_scales`
--

CREATE TABLE `product_measurement_scales` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `measurement_types` json DEFAULT NULL COMMENT 'Array of measurement type names like ["BACK width", "Chest", "Length"]',
  `measurements_data` json DEFAULT NULL COMMENT 'Object with measurement_type as key and size->value mapping as value',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tolerance_data` json DEFAULT NULL COMMENT 'Object with measurement_type as key and tolerance value as value like {"BACK width": 0.5, "Chest": 1.0}'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_sizes_config`
--

CREATE TABLE `product_sizes_config` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `size_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_value` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `no_sizes` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_size_configuration_history`
--

CREATE TABLE `product_size_configuration_history` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `transfer_batch_id` int DEFAULT NULL,
  `size_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_value` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `action_type` enum('initial','added','updated','preserved') COLLATE utf8mb4_unicode_ci NOT NULL,
  `configured_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `previous_quantity` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_transfer_batches`
--

CREATE TABLE `product_transfer_batches` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `boutique_origin` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_product_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_quantity` int DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id_reservation` int NOT NULL,
  `nom_client` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_client` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone_client` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_reservation` date NOT NULL,
  `heure_reservation` time NOT NULL,
  `statut_reservation` enum('pending','confirmed','cancelled','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes_reservation` text COLLATE utf8mb4_unicode_ci,
  `date_creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_confirmation` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `specification_templates`
--

CREATE TABLE `specification_templates` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Specification name (e.g., Matériaux, Boutons)',
  `input_type` enum('input','select','checkbox') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'input' COMMENT 'Type of input: free text, dropdown, or checkboxes',
  `options` json DEFAULT NULL COMMENT 'Array of options for select/checkbox types: ["Option 1", "Option 2"]',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Whether this template is active',
  `display_order` int DEFAULT '0' COMMENT 'Order in which templates appear',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surmesure_tries`
--

CREATE TABLE `surmesure_tries` (
  `id` int NOT NULL,
  `order_id` int NOT NULL,
  `try_number` int NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `temp_messages`
--

CREATE TABLE `temp_messages` (
  `id_temp_message` int NOT NULL,
  `temp_session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` enum('text','image') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_sent` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `transferred` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `visitor_tracking`
--

CREATE TABLE `visitor_tracking` (
  `id` int NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `page_visited` varchar(255) NOT NULL,
  `referrer` varchar(500) DEFAULT 'Direct',
  `user_agent` text,
  `city` varchar(100) DEFAULT 'Unknown',
  `country` varchar(100) DEFAULT 'Unknown',
  `device_type` varchar(20) DEFAULT 'Unknown',
  `session_id` varchar(100) DEFAULT NULL,
  `visit_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_surmesure_orders_complete`
-- (See below for the actual view)
--
CREATE TABLE `vw_surmesure_orders_complete` (
`client_address` text
,`client_email` varchar(255)
,`client_name` varchar(100)
,`client_phone` varchar(20)
,`client_region` varchar(50)
,`client_vorname` varchar(100)
,`comments_count` bigint
,`created_at` timestamp
,`first_try_completed_at` datetime
,`first_try_date` date
,`first_try_full_scheduled` varchar(21)
,`first_try_scheduled_time` time
,`id` int
,`images_count` bigint
,`measurements` json
,`product_name` varchar(255)
,`ready_date` date
,`second_try_completed_at` datetime
,`second_try_date` date
,`second_try_full_scheduled` varchar(21)
,`second_try_scheduled_time` time
,`status` enum('new','in_progress','ready_for_pickup','ready_for_pickup','first_try','needs_revision','ready_for_second_try','completed')
,`third_try_completed_at` datetime
,`third_try_date` date
,`third_try_full_scheduled` varchar(21)
,`third_try_scheduled_time` time
,`tolerance` json
,`updated_at` timestamp
,`videos_count` bigint
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `batch_status_history`
--
ALTER TABLE `batch_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_id` (`batch_id`),
  ADD KEY `idx_changed_at` (`changed_at`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id_message`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id_customer`);

--
-- Indexes for table `delivery_addresses`
--
ALTER TABLE `delivery_addresses`
  ADD PRIMARY KEY (`id_delivery_address`);

--
-- Indexes for table `emails`
--
ALTER TABLE `emails`
  ADD PRIMARY KEY (`id_email`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id_subscriber`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id_order`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id_order_item`);

--
-- Indexes for table `productions_batches_images`
--
ALTER TABLE `productions_batches_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_id` (`batch_id`);

--
-- Indexes for table `productions_products_lucci`
--
ALTER TABLE `productions_products_lucci`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_external_lucci` (`external_product_id`);

--
-- Indexes for table `productions_products_spada`
--
ALTER TABLE `productions_products_spada`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_external_spada` (`external_product_id`);

--
-- Indexes for table `production_batches`
--
ALTER TABLE `production_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_batch_reference` (`batch_reference`),
  ADD KEY `started_by` (`started_by`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `cancelled_by` (`cancelled_by`),
  ADD KEY `idx_is_seen_status` (`is_seen`,`status`),
  ADD KEY `idx_created_is_seen` (`created_at`,`is_seen`);

--
-- Indexes for table `production_batch_attachments`
--
ALTER TABLE `production_batch_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_id` (`batch_id`);

--
-- Indexes for table `production_batch_leftovers`
--
ALTER TABLE `production_batch_leftovers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_id` (`batch_id`),
  ADD KEY `idx_material_id` (`material_id`),
  ADD KEY `idx_readded_to_stock` (`readded_to_stock`);

--
-- Indexes for table `production_batch_materials`
--
ALTER TABLE `production_batch_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quantity_type_id` (`quantity_type_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_batch_id` (`batch_id`),
  ADD KEY `idx_material_id` (`material_id`);

--
-- Indexes for table `production_batch_notes`
--
ALTER TABLE `production_batch_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_batch_id` (`batch_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `production_clients`
--
ALTER TABLE `production_clients`
  ADD PRIMARY KEY (`client_id`);

--
-- Indexes for table `production_clients_externes`
--
ALTER TABLE `production_clients_externes`
  ADD PRIMARY KEY (`external_client_id`);

--
-- Indexes for table `production_employees`
--
ALTER TABLE `production_employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date_naissance` (`date_naissance`);

--
-- Indexes for table `production_holidays`
--
ALTER TABLE `production_holidays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_employee_date` (`employee_id`,`date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `production_images`
--
ALTER TABLE `production_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `uploaded_user` (`uploaded_user`);

--
-- Indexes for table `production_materials_fournisseurs`
--
ALTER TABLE `production_materials_fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `production_matieres`
--
ALTER TABLE `production_matieres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quantity_type_id` (`quantity_type_id`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_nom` (`nom`),
  ADD KEY `idx_reference` (`reference`),
  ADD KEY `idx_fournisseur` (`id_fournisseur`),
  ADD KEY `idx_materiere_type` (`materiere_type`),
  ADD KEY `idx_extern_customer` (`extern_customer_id`),
  ADD KEY `idx_laize` (`laize`);

--
-- Indexes for table `production_matieres_category`
--
ALTER TABLE `production_matieres_category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nom` (`nom`);

--
-- Indexes for table `production_products_attachments`
--
ALTER TABLE `production_products_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `production_product_materials`
--
ALTER TABLE `production_product_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quantity_type_id` (`quantity_type_id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_material_id` (`material_id`),
  ADD KEY `idx_product_material` (`product_id`,`material_id`);

--
-- Indexes for table `production_produits`
--
ALTER TABLE `production_produits`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `created_user` (`created_user`),
  ADD KEY `modified_user` (`modified_user`);

--
-- Indexes for table `production_produits_externes`
--
ALTER TABLE `production_produits_externes`
  ADD PRIMARY KEY (`external_product_id`),
  ADD KEY `external_client_id` (`external_client_id`);

--
-- Indexes for table `production_produit_matieres`
--
ALTER TABLE `production_produit_matieres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `material_id` (`material_id`);

--
-- Indexes for table `production_quantity_types`
--
ALTER TABLE `production_quantity_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nom` (`nom`);

--
-- Indexes for table `production_ready_products`
--
ALTER TABLE `production_ready_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_boutique_product` (`boutique_origin`,`external_product_id`),
  ADD KEY `idx_boutique_origin` (`boutique_origin`),
  ADD KEY `idx_status` (`status_product`),
  ADD KEY `fk_last_transfer_batch` (`last_transfer_batch_id`),
  ADD KEY `idx_is_seen_transfer_date` (`is_seen`,`transfer_date`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_active_in_production` (`is_active`,`is_in_production`);

--
-- Indexes for table `production_ready_products_mesure`
--
ALTER TABLE `production_ready_products_mesure`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_measurement_size` (`product_id`,`measurement_name`,`size_value`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_measurement_name` (`measurement_name`),
  ADD KEY `idx_size_value` (`size_value`);

--
-- Indexes for table `production_rh_config`
--
ALTER TABLE `production_rh_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Indexes for table `production_salaries`
--
ALTER TABLE `production_salaries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_effective` (`employee_id`,`effective_from`);

--
-- Indexes for table `production_salary_config`
--
ALTER TABLE `production_salary_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`),
  ADD KEY `idx_config_key` (`config_key`);

--
-- Indexes for table `production_schedules`
--
ALTER TABLE `production_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_emp_date` (`employee_id`,`date`),
  ADD KEY `idx_date` (`date`);

--
-- Indexes for table `production_shift_templates`
--
ALTER TABLE `production_shift_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_weekday` (`employee_id`,`weekday`);

--
-- Indexes for table `production_soustraitance_clients`
--
ALTER TABLE `production_soustraitance_clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `production_soustraitance_clients_files`
--
ALTER TABLE `production_soustraitance_clients_files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_upload_date` (`upload_date`);

--
-- Indexes for table `production_soustraitance_products`
--
ALTER TABLE `production_soustraitance_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_status` (`status_product`),
  ADD KEY `idx_category` (`category_product`);

--
-- Indexes for table `production_soustraitance_products_files`
--
ALTER TABLE `production_soustraitance_products_files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `production_soustraitance_products_mesure`
--
ALTER TABLE `production_soustraitance_products_mesure`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_measurement_size` (`product_id`,`measurement_name`,`size_value`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_measurement_name` (`measurement_name`),
  ADD KEY `idx_size_value` (`size_value`);

--
-- Indexes for table `production_soustraitance_product_materials`
--
ALTER TABLE `production_soustraitance_product_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_material_id` (`material_id`),
  ADD KEY `idx_quantity_type_id` (`quantity_type_id`),
  ADD KEY `idx_soustraitance_product_material` (`product_id`,`material_id`);

--
-- Indexes for table `production_soustraitance_stock`
--
ALTER TABLE `production_soustraitance_stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_size` (`product_id`,`size_name`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_size_name` (`size_name`),
  ADD KEY `idx_stock_quantity` (`stock_quantity`);

--
-- Indexes for table `production_soustraitance_stock_history`
--
ALTER TABLE `production_soustraitance_stock_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stock_id` (`stock_id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_change_date` (`change_date`);

--
-- Indexes for table `production_surmesure_commandes`
--
ALTER TABLE `production_surmesure_commandes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_client_email` (`client_email`),
  ADD KEY `idx_ready_date` (`ready_date`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_surmesure_updated_at` (`updated_at`),
  ADD KEY `idx_first_try_completed` (`first_try_completed_at`),
  ADD KEY `idx_second_try_completed` (`second_try_completed_at`),
  ADD KEY `idx_third_try_completed` (`third_try_completed_at`),
  ADD KEY `idx_surmesure_is_seen` (`is_seen`),
  ADD KEY `idx_surmesure_status_seen` (`status`,`is_seen`),
  ADD KEY `idx_couple` (`id`);

--
-- Indexes for table `production_surmesure_commentaires`
--
ALTER TABLE `production_surmesure_commentaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commande_id` (`commande_id`),
  ADD KEY `idx_date_creation` (`date_creation`);

--
-- Indexes for table `production_surmesure_images`
--
ALTER TABLE `production_surmesure_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commande_id` (`commande_id`);

--
-- Indexes for table `production_surmesure_matieres`
--
ALTER TABLE `production_surmesure_matieres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commande_id` (`commande_id`),
  ADD KEY `idx_material_id` (`material_id`),
  ADD KEY `idx_quantity_type_id` (`quantity_type_id`),
  ADD KEY `idx_stock_deducted` (`stock_deducted`),
  ADD KEY `idx_commande_deducted` (`commande_id`,`stock_deducted`);

--
-- Indexes for table `production_surmesure_optionfinition`
--
ALTER TABLE `production_surmesure_optionfinition`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commande_id` (`commande_id`),
  ADD KEY `idx_created_date` (`created_date`);

--
-- Indexes for table `production_surmesure_videos`
--
ALTER TABLE `production_surmesure_videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commande_id` (`commande_id`);

--
-- Indexes for table `production_sync_log`
--
ALTER TABLE `production_sync_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `started_by` (`started_by`),
  ADD KEY `idx_boutique` (`boutique`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `production_tax_brackets`
--
ALTER TABLE `production_tax_brackets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active` (`active`),
  ADD KEY `idx_bracket_order` (`bracket_order`);

--
-- Indexes for table `production_time_entries`
--
ALTER TABLE `production_time_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_emp_date_entry` (`employee_id`,`date`),
  ADD KEY `idx_date_entry` (`date`);

--
-- Indexes for table `production_transactions_stock`
--
ALTER TABLE `production_transactions_stock`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `quantity_type_id` (`quantity_type_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_material_id` (`material_id`),
  ADD KEY `idx_type_mouvement` (`type_mouvement`),
  ADD KEY `idx_date_transaction` (`date_transaction`);

--
-- Indexes for table `production_utilisateurs`
--
ALTER TABLE `production_utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `production_videos`
--
ALTER TABLE `production_videos`
  ADD PRIMARY KEY (`video_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `uploaded_user` (`uploaded_user`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id_product`);

--
-- Indexes for table `product_measurement_scales`
--
ALTER TABLE `product_measurement_scales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `product_sizes_config`
--
ALTER TABLE `product_sizes_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_size` (`product_id`,`size_type`,`size_value`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_size_type` (`size_type`),
  ADD KEY `idx_no_sizes` (`product_id`,`size_type`);

--
-- Indexes for table `product_size_configuration_history`
--
ALTER TABLE `product_size_configuration_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_transfer_batch` (`transfer_batch_id`),
  ADD KEY `idx_size_config` (`product_id`,`size_type`,`size_value`),
  ADD KEY `idx_configured_at` (`configured_at`);

--
-- Indexes for table `product_transfer_batches`
--
ALTER TABLE `product_transfer_batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_boutique_external` (`boutique_origin`,`external_product_id`),
  ADD KEY `idx_transfer_date` (`transfer_date`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id_reservation`);

--
-- Indexes for table `specification_templates`
--
ALTER TABLE `specification_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active_order` (`is_active`,`display_order`);

--
-- Indexes for table `surmesure_tries`
--
ALTER TABLE `surmesure_tries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_order_try` (`order_id`,`try_number`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_try_number` (`try_number`);

--
-- Indexes for table `visitor_tracking`
--
ALTER TABLE `visitor_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_page_visited` (`page_visited`),
  ADD KEY `idx_visit_date` (`visit_date`),
  ADD KEY `idx_country` (`country`),
  ADD KEY `idx_device_type` (`device_type`),
  ADD KEY `idx_session_id` (`session_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `batch_status_history`
--
ALTER TABLE `batch_status_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id_message` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id_customer` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_addresses`
--
ALTER TABLE `delivery_addresses`
  MODIFY `id_delivery_address` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emails`
--
ALTER TABLE `emails`
  MODIFY `id_email` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id_subscriber` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id_order` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id_order_item` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productions_batches_images`
--
ALTER TABLE `productions_batches_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productions_products_lucci`
--
ALTER TABLE `productions_products_lucci`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productions_products_spada`
--
ALTER TABLE `productions_products_spada`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_batches`
--
ALTER TABLE `production_batches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_batch_attachments`
--
ALTER TABLE `production_batch_attachments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_batch_leftovers`
--
ALTER TABLE `production_batch_leftovers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_batch_materials`
--
ALTER TABLE `production_batch_materials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_batch_notes`
--
ALTER TABLE `production_batch_notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_clients`
--
ALTER TABLE `production_clients`
  MODIFY `client_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_clients_externes`
--
ALTER TABLE `production_clients_externes`
  MODIFY `external_client_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_employees`
--
ALTER TABLE `production_employees`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_holidays`
--
ALTER TABLE `production_holidays`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_images`
--
ALTER TABLE `production_images`
  MODIFY `image_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_materials_fournisseurs`
--
ALTER TABLE `production_materials_fournisseurs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_matieres`
--
ALTER TABLE `production_matieres`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_matieres_category`
--
ALTER TABLE `production_matieres_category`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_products_attachments`
--
ALTER TABLE `production_products_attachments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_product_materials`
--
ALTER TABLE `production_product_materials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_produits`
--
ALTER TABLE `production_produits`
  MODIFY `product_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_produits_externes`
--
ALTER TABLE `production_produits_externes`
  MODIFY `external_product_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_produit_matieres`
--
ALTER TABLE `production_produit_matieres`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_quantity_types`
--
ALTER TABLE `production_quantity_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_ready_products`
--
ALTER TABLE `production_ready_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_ready_products_mesure`
--
ALTER TABLE `production_ready_products_mesure`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_rh_config`
--
ALTER TABLE `production_rh_config`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_salaries`
--
ALTER TABLE `production_salaries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_salary_config`
--
ALTER TABLE `production_salary_config`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_schedules`
--
ALTER TABLE `production_schedules`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_shift_templates`
--
ALTER TABLE `production_shift_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_clients`
--
ALTER TABLE `production_soustraitance_clients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_clients_files`
--
ALTER TABLE `production_soustraitance_clients_files`
  MODIFY `file_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_products`
--
ALTER TABLE `production_soustraitance_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_products_files`
--
ALTER TABLE `production_soustraitance_products_files`
  MODIFY `file_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_products_mesure`
--
ALTER TABLE `production_soustraitance_products_mesure`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_product_materials`
--
ALTER TABLE `production_soustraitance_product_materials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_stock`
--
ALTER TABLE `production_soustraitance_stock`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_soustraitance_stock_history`
--
ALTER TABLE `production_soustraitance_stock_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_surmesure_commandes`
--
ALTER TABLE `production_surmesure_commandes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_surmesure_commentaires`
--
ALTER TABLE `production_surmesure_commentaires`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_surmesure_images`
--
ALTER TABLE `production_surmesure_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_surmesure_matieres`
--
ALTER TABLE `production_surmesure_matieres`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_surmesure_optionfinition`
--
ALTER TABLE `production_surmesure_optionfinition`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_surmesure_videos`
--
ALTER TABLE `production_surmesure_videos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_sync_log`
--
ALTER TABLE `production_sync_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_tax_brackets`
--
ALTER TABLE `production_tax_brackets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_time_entries`
--
ALTER TABLE `production_time_entries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_transactions_stock`
--
ALTER TABLE `production_transactions_stock`
  MODIFY `transaction_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_utilisateurs`
--
ALTER TABLE `production_utilisateurs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_videos`
--
ALTER TABLE `production_videos`
  MODIFY `video_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id_product` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_measurement_scales`
--
ALTER TABLE `product_measurement_scales`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_sizes_config`
--
ALTER TABLE `product_sizes_config`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_size_configuration_history`
--
ALTER TABLE `product_size_configuration_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_transfer_batches`
--
ALTER TABLE `product_transfer_batches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id_reservation` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `specification_templates`
--
ALTER TABLE `specification_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `surmesure_tries`
--
ALTER TABLE `surmesure_tries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visitor_tracking`
--
ALTER TABLE `visitor_tracking`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `vw_surmesure_orders_complete`
--
DROP TABLE IF EXISTS `vw_surmesure_orders_complete`;

CREATE ALGORITHM=UNDEFINED DEFINER=`luccybcdb`@`%` SQL SECURITY DEFINER VIEW `vw_surmesure_orders_complete`  AS SELECT `c`.`id` AS `id`, `c`.`client_name` AS `client_name`, `c`.`client_vorname` AS `client_vorname`, `c`.`client_email` AS `client_email`, `c`.`client_phone` AS `client_phone`, `c`.`client_address` AS `client_address`, `c`.`client_region` AS `client_region`, `c`.`product_name` AS `product_name`, `c`.`ready_date` AS `ready_date`, `c`.`first_try_date` AS `first_try_date`, `c`.`second_try_date` AS `second_try_date`, `c`.`third_try_date` AS `third_try_date`, `c`.`status` AS `status`, `c`.`measurements` AS `measurements`, `c`.`tolerance` AS `tolerance`, `c`.`created_at` AS `created_at`, `c`.`updated_at` AS `updated_at`, `c`.`first_try_completed_at` AS `first_try_completed_at`, `c`.`second_try_completed_at` AS `second_try_completed_at`, `c`.`third_try_completed_at` AS `third_try_completed_at`, `c`.`first_try_scheduled_time` AS `first_try_scheduled_time`, `c`.`second_try_scheduled_time` AS `second_try_scheduled_time`, `c`.`third_try_scheduled_time` AS `third_try_scheduled_time`, (case when (`c`.`first_try_scheduled_time` is not null) then concat(`c`.`first_try_date`,' ',`c`.`first_try_scheduled_time`) else `c`.`first_try_date` end) AS `first_try_full_scheduled`, (case when (`c`.`second_try_scheduled_time` is not null) then concat(`c`.`second_try_date`,' ',`c`.`second_try_scheduled_time`) else `c`.`second_try_date` end) AS `second_try_full_scheduled`, (case when (`c`.`third_try_scheduled_time` is not null) then concat(`c`.`third_try_date`,' ',`c`.`third_try_scheduled_time`) else `c`.`third_try_date` end) AS `third_try_full_scheduled`, (select count(0) from `production_surmesure_images` `i` where (`i`.`commande_id` = `c`.`id`)) AS `images_count`, (select count(0) from `production_surmesure_videos` `v` where (`v`.`commande_id` = `c`.`id`)) AS `videos_count`, (select count(0) from `production_surmesure_commentaires` `co` where (`co`.`commande_id` = `c`.`id`)) AS `comments_count` FROM `production_surmesure_commandes` AS `c` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `batch_status_history`
--
ALTER TABLE `batch_status_history`
  ADD CONSTRAINT `batch_status_history_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_batches`
--
ALTER TABLE `production_batches`
  ADD CONSTRAINT `production_batches_ibfk_2` FOREIGN KEY (`started_by`) REFERENCES `production_utilisateurs` (`id`),
  ADD CONSTRAINT `production_batches_ibfk_3` FOREIGN KEY (`cancelled_by`) REFERENCES `production_utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_batch_leftovers`
--
ALTER TABLE `production_batch_leftovers`
  ADD CONSTRAINT `production_batch_leftovers_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_batch_leftovers_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_batch_materials`
--
ALTER TABLE `production_batch_materials`
  ADD CONSTRAINT `production_batch_materials_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_batch_materials_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_batch_materials_ibfk_3` FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  ADD CONSTRAINT `production_batch_materials_ibfk_4` FOREIGN KEY (`transaction_id`) REFERENCES `production_transactions_stock` (`transaction_id`) ON DELETE SET NULL;

--
-- Constraints for table `production_batch_notes`
--
ALTER TABLE `production_batch_notes`
  ADD CONSTRAINT `production_batch_notes_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_holidays`
--
ALTER TABLE `production_holidays`
  ADD CONSTRAINT `production_holidays_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `production_employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_holidays_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `production_employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `production_holidays_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `production_employees` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_images`
--
ALTER TABLE `production_images`
  ADD CONSTRAINT `production_images_ibfk_1` FOREIGN KEY (`uploaded_user`) REFERENCES `production_utilisateurs` (`id`);

--
-- Constraints for table `production_matieres`
--
ALTER TABLE `production_matieres`
  ADD CONSTRAINT `production_matieres_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `production_matieres_category` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `production_matieres_ibfk_2` FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  ADD CONSTRAINT `production_matieres_ibfk_3` FOREIGN KEY (`id_fournisseur`) REFERENCES `production_materials_fournisseurs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_product_materials`
--
ALTER TABLE `production_product_materials`
  ADD CONSTRAINT `production_product_materials_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_ready_products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_product_materials_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_product_materials_ibfk_3` FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`);

--
-- Constraints for table `production_produits`
--
ALTER TABLE `production_produits`
  ADD CONSTRAINT `production_produits_ibfk_1` FOREIGN KEY (`created_user`) REFERENCES `production_utilisateurs` (`id`),
  ADD CONSTRAINT `production_produits_ibfk_2` FOREIGN KEY (`modified_user`) REFERENCES `production_utilisateurs` (`id`);

--
-- Constraints for table `production_produits_externes`
--
ALTER TABLE `production_produits_externes`
  ADD CONSTRAINT `production_produits_externes_ibfk_1` FOREIGN KEY (`external_client_id`) REFERENCES `production_clients_externes` (`external_client_id`);

--
-- Constraints for table `production_produit_matieres`
--
ALTER TABLE `production_produit_matieres`
  ADD CONSTRAINT `production_produit_matieres_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_produits` (`product_id`),
  ADD CONSTRAINT `production_produit_matieres_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`);

--
-- Constraints for table `production_ready_products`
--
ALTER TABLE `production_ready_products`
  ADD CONSTRAINT `fk_last_transfer_batch` FOREIGN KEY (`last_transfer_batch_id`) REFERENCES `product_transfer_batches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_ready_products_mesure`
--
ALTER TABLE `production_ready_products_mesure`
  ADD CONSTRAINT `production_ready_products_mesure_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_ready_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_salaries`
--
ALTER TABLE `production_salaries`
  ADD CONSTRAINT `production_salaries_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `production_employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_schedules`
--
ALTER TABLE `production_schedules`
  ADD CONSTRAINT `production_schedules_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `production_employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_shift_templates`
--
ALTER TABLE `production_shift_templates`
  ADD CONSTRAINT `production_shift_templates_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `production_employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_soustraitance_clients_files`
--
ALTER TABLE `production_soustraitance_clients_files`
  ADD CONSTRAINT `production_soustraitance_clients_files_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `production_soustraitance_clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_soustraitance_products`
--
ALTER TABLE `production_soustraitance_products`
  ADD CONSTRAINT `production_soustraitance_products_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `production_soustraitance_clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_soustraitance_products_mesure`
--
ALTER TABLE `production_soustraitance_products_mesure`
  ADD CONSTRAINT `production_soustraitance_products_mesure_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_soustraitance_product_materials`
--
ALTER TABLE `production_soustraitance_product_materials`
  ADD CONSTRAINT `production_soustraitance_product_materials_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_soustraitance_product_materials_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_soustraitance_product_materials_ibfk_3` FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_soustraitance_stock`
--
ALTER TABLE `production_soustraitance_stock`
  ADD CONSTRAINT `production_soustraitance_stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_soustraitance_stock_history`
--
ALTER TABLE `production_soustraitance_stock_history`
  ADD CONSTRAINT `production_soustraitance_stock_history_ibfk_1` FOREIGN KEY (`stock_id`) REFERENCES `production_soustraitance_stock` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_soustraitance_stock_history_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `production_soustraitance_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_surmesure_commentaires`
--
ALTER TABLE `production_surmesure_commentaires`
  ADD CONSTRAINT `production_surmesure_commentaires_ibfk_1` FOREIGN KEY (`commande_id`) REFERENCES `production_surmesure_commandes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_surmesure_images`
--
ALTER TABLE `production_surmesure_images`
  ADD CONSTRAINT `production_surmesure_images_ibfk_1` FOREIGN KEY (`commande_id`) REFERENCES `production_surmesure_commandes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_surmesure_matieres`
--
ALTER TABLE `production_surmesure_matieres`
  ADD CONSTRAINT `production_surmesure_matieres_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_surmesure_matieres_ibfk_2` FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `production_surmesure_optionfinition`
--
ALTER TABLE `production_surmesure_optionfinition`
  ADD CONSTRAINT `production_surmesure_optionfinition_ibfk_1` FOREIGN KEY (`commande_id`) REFERENCES `production_surmesure_commandes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_surmesure_videos`
--
ALTER TABLE `production_surmesure_videos`
  ADD CONSTRAINT `production_surmesure_videos_ibfk_1` FOREIGN KEY (`commande_id`) REFERENCES `production_surmesure_commandes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_sync_log`
--
ALTER TABLE `production_sync_log`
  ADD CONSTRAINT `production_sync_log_ibfk_1` FOREIGN KEY (`started_by`) REFERENCES `production_utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_time_entries`
--
ALTER TABLE `production_time_entries`
  ADD CONSTRAINT `production_time_entries_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `production_employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `production_transactions_stock`
--
ALTER TABLE `production_transactions_stock`
  ADD CONSTRAINT `production_transactions_stock_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `production_matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `production_transactions_stock_ibfk_2` FOREIGN KEY (`quantity_type_id`) REFERENCES `production_quantity_types` (`id`),
  ADD CONSTRAINT `production_transactions_stock_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `production_utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `production_videos`
--
ALTER TABLE `production_videos`
  ADD CONSTRAINT `production_videos_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `production_commandes_surmesure` (`order_id`),
  ADD CONSTRAINT `production_videos_ibfk_2` FOREIGN KEY (`uploaded_user`) REFERENCES `production_utilisateurs` (`id`);

--
-- Constraints for table `product_measurement_scales`
--
ALTER TABLE `product_measurement_scales`
  ADD CONSTRAINT `product_measurement_scales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_ready_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_sizes_config`
--
ALTER TABLE `product_sizes_config`
  ADD CONSTRAINT `product_sizes_config_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `production_ready_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_size_configuration_history`
--
ALTER TABLE `product_size_configuration_history`
  ADD CONSTRAINT `product_size_configuration_history_ibfk_1` FOREIGN KEY (`transfer_batch_id`) REFERENCES `product_transfer_batches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `surmesure_tries`
--
ALTER TABLE `surmesure_tries`
  ADD CONSTRAINT `fk_surmesure_tries_order` FOREIGN KEY (`order_id`) REFERENCES `production_surmesure_commandes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
