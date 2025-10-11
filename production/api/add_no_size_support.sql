-- Add no_size column to production_soustraitance_products table
ALTER TABLE `production_soustraitance_products` 
ADD COLUMN `no_size` TINYINT(1) DEFAULT 0 COMMENT 'Product has no specific sizes (accessories, etc.)' 
AFTER `size_125`;

-- Update existing products logic: if no sizes are configured, set no_size to 1
UPDATE `production_soustraitance_products` 
SET `no_size` = 1 
WHERE `size_xs` = 0 
  AND `size_s` = 0 
  AND `size_m` = 0 
  AND `size_l` = 0 
  AND `size_xl` = 0 
  AND `size_xxl` = 0 
  AND `size_3xl` = 0 
  AND `size_4xl` = 0 
  AND `size_30` = 0 
  AND `size_31` = 0 
  AND `size_32` = 0 
  AND `size_33` = 0 
  AND `size_34` = 0 
  AND `size_36` = 0 
  AND `size_38` = 0 
  AND `size_39` = 0 
  AND `size_40` = 0 
  AND `size_41` = 0 
  AND `size_42` = 0 
  AND `size_43` = 0 
  AND `size_44` = 0 
  AND `size_45` = 0 
  AND `size_46` = 0 
  AND `size_47` = 0 
  AND `size_48` = 0 
  AND `size_50` = 0 
  AND `size_52` = 0 
  AND `size_54` = 0 
  AND `size_56` = 0 
  AND `size_58` = 0 
  AND `size_60` = 0 
  AND `size_62` = 0 
  AND `size_64` = 0 
  AND `size_66` = 0 
  AND `size_85` = 0 
  AND `size_90` = 0 
  AND `size_95` = 0 
  AND `size_100` = 0 
  AND `size_105` = 0 
  AND `size_110` = 0 
  AND `size_115` = 0 
  AND `size_120` = 0 
  AND `size_125` = 0;