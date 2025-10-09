-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: luccybcdb.mysql.db
-- Generation Time: Oct 01, 2025 at 10:59 AM
-- Server version: 8.0.43-34
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `luccybcdb`
--

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

--
-- Indexes for dumped tables
--

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `production_ready_products`
--
ALTER TABLE `production_ready_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `production_ready_products`
--
ALTER TABLE `production_ready_products`
  ADD CONSTRAINT `fk_last_transfer_batch` FOREIGN KEY (`last_transfer_batch_id`) REFERENCES `product_transfer_batches` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
