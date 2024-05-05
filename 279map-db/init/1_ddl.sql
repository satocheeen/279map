SET CHARSET UTF8;

-- 279map_db.map_page_info definition

CREATE TABLE `map_page_info` (
  `map_page_id` varchar(100) NOT NULL,
  `title` varchar(100) NOT NULL,
  `use_maps` varchar(100) NOT NULL,
  `default_map` enum('Real','Virtual') NOT NULL,
  `public_range` enum('Public','Private') NOT NULL,
  `options` json DEFAULT NULL,
  `description` text COMMENT '地図説明',
  `thumbnail` mediumtext COMMENT '地図説明用のサムネイル画像',
  `odba_connection` json NOT NULL COMMENT '原本DB関連の任意情報',
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`map_page_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.data_source definition

CREATE TABLE `data_source` (
  `data_source_id` varchar(100) NOT NULL,
  `location_kind` enum('VirtualItem','RealItem','Track','None') NOT NULL,
  `config` json NOT NULL,
  `location_define` json DEFAULT NULL COMMENT '位置項目定義情報',
  `contents_define` json DEFAULT NULL COMMENT 'コンテンツ項目定義情報',
  `odba_connection` json NOT NULL COMMENT '原本DB関連の任意情報',
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`data_source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.map_datasource_link definition

CREATE TABLE `map_datasource_link` (
  `map_page_id` varchar(100) NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `datasource_name` varchar(100) NOT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `order_num` tinyint(3) unsigned DEFAULT NULL,
  `mdl_config` json NOT NULL COMMENT '地図単位で指定するデータソースに関する任意情報',
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`map_page_id`,`data_source_id`),
  KEY `map_datasource_link_FK_1` (`data_source_id`),
  CONSTRAINT `map_datasource_link_FK` FOREIGN KEY (`map_page_id`) REFERENCES `map_page_info` (`map_page_id`) ON DELETE CASCADE,
  CONSTRAINT `map_datasource_link_FK_1` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 279map_db.original_icons definition

CREATE TABLE `original_icons` (
  `icon_page_id` varchar(100) NOT NULL,
  `caption` varchar(100) DEFAULT NULL,
  `base64` mediumtext NOT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  `map_page_id` varchar(100) NOT NULL,
  `use_maps` varchar(100) NOT NULL,
  PRIMARY KEY (`icon_page_id`),
  KEY `original_icons_FK` (`map_page_id`),
  CONSTRAINT `original_icons_FK` FOREIGN KEY (`map_page_id`) REFERENCES `map_page_info` (`map_page_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 279map_db.datas definition

CREATE TABLE `datas` (
  `data_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `data_source_id` varchar(100) DEFAULT NULL,
  `original_id` varchar(100) NOT NULL COMMENT '出典元データのID。ODBAで登録・更新を行う際に参照する用途。',
  `name` varchar(100) DEFAULT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`data_id`),
  KEY `datas_FK` (`data_source_id`),
  CONSTRAINT `datas_FK` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.items definition

CREATE TABLE `items` (
  `data_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`data_id`),
  CONSTRAINT `items_FK` FOREIGN KEY (`data_id`) REFERENCES `datas` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.contents definition

CREATE TABLE `contents` (
  `data_id` int(10) unsigned NOT NULL,
  `contents` json DEFAULT NULL,
  `category` json DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`data_id`),
  CONSTRAINT `contents_FK` FOREIGN KEY (`data_id`) REFERENCES `datas` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.geometry_items definition

CREATE TABLE `geometry_items` (
  `data_id` int(10) unsigned NOT NULL,
  `item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `min_zoom` float NOT NULL,
  `max_zoom` float NOT NULL,
  `geometry` geometry NOT NULL,
  `geo_properties` text,
  PRIMARY KEY (`item_id`),
  KEY `items_sub_FK` (`data_id`),
  CONSTRAINT `items_sub_FK` FOREIGN KEY (`data_id`) REFERENCES `items` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.images definition

CREATE TABLE `images` (
  `image_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `data_id` int(10) unsigned NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `thumbnail` mediumtext NOT NULL,
  `medium` mediumtext NOT NULL,
  `field_key` varchar(100) NOT NULL COMMENT '対応するコンテンツFieldのキー',
  PRIMARY KEY (`image_id`),
  KEY `images_FK` (`data_id`,`data_source_id`),
  CONSTRAINT `images_FK` FOREIGN KEY (`data_id`) REFERENCES `contents` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=335 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.item_content_link definition

CREATE TABLE `item_content_link` (
  `item_data_id` int(10) unsigned NOT NULL COMMENT 'itemまたはtrackのdata_id',
  `content_data_id` int(10) unsigned NOT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`item_data_id`,`content_data_id`),
  KEY `item_content_link_FK_1` (`content_data_id`),
  CONSTRAINT `item_content_link_FK` FOREIGN KEY (`content_data_id`) REFERENCES `contents` (`data_id`) ON DELETE CASCADE,
  CONSTRAINT `item_content_link_FK_1` FOREIGN KEY (`item_data_id`) REFERENCES `items` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;