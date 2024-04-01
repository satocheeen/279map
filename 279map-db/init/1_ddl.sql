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
  `thumbnail` mediumtext NOT NULL COMMENT '地図説明用のサムネイル画像',
  `odba_connection` json NOT NULL COMMENT '原本DB関連の任意情報',
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`map_page_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.data_source definition

CREATE TABLE `data_source` (
  `data_source_id` varchar(100) NOT NULL,
  `kind` enum('VirtualItem','RealItem','RealPointContent','Content','Track') NOT NULL,
  `config` json NOT NULL,
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


-- 279map_db.contents definition

CREATE TABLE `contents` (
  `content_page_id` varchar(100) NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `parent_id` varchar(100) DEFAULT NULL,
  `parent_datasource_id` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `contents` json DEFAULT NULL,
  `category` json DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `supplement` json DEFAULT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`content_page_id`,`data_source_id`),
  KEY `contents_FK` (`parent_id`),
  KEY `contents_FK_1` (`data_source_id`),
  KEY `contents_FK_2` (`parent_id`,`parent_datasource_id`),
  CONSTRAINT `contents_FK_1` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`data_source_id`) ON DELETE CASCADE,
  CONSTRAINT `contents_FK_2` FOREIGN KEY (`parent_id`, `parent_datasource_id`) REFERENCES `contents` (`content_page_id`, `data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.images definition

CREATE TABLE `images` (
  `image_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `content_page_id` varchar(100) NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `thumbnail` mediumtext NOT NULL,
  `medium` mediumtext NOT NULL,
  `field_key` varchar(100) NOT NULL COMMENT '対応するコンテンツFieldのキー',
  PRIMARY KEY (`image_id`),
  KEY `images_FK` (`content_page_id`,`data_source_id`),
  CONSTRAINT `images_FK` FOREIGN KEY (`content_page_id`, `data_source_id`) REFERENCES `contents` (`content_page_id`, `data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.items definition

CREATE TABLE `items` (
  `item_page_id` varchar(100) NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `location` geometry NOT NULL,
  `geo_properties` text,
  `name` varchar(100) DEFAULT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`item_page_id`,`data_source_id`),
  KEY `point_contents_FK` (`data_source_id`) USING BTREE,
  CONSTRAINT `items_FK` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.item_content_link definition

CREATE TABLE `item_content_link` (
  `item_page_id` varchar(100) NOT NULL,
  `item_datasource_id` varchar(100) NOT NULL,
  `content_page_id` varchar(100) NOT NULL,
  `content_datasource_id` varchar(100) NOT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`item_page_id`,`content_page_id`,`item_datasource_id`,`content_datasource_id`),
  KEY `item_content_link_FK_1` (`content_page_id`),
  KEY `item_content_link_FK` (`item_page_id`,`item_datasource_id`),
  KEY `item_content_link_FK_2` (`content_page_id`,`content_datasource_id`),
  CONSTRAINT `item_content_link_FK` FOREIGN KEY (`item_page_id`, `item_datasource_id`) REFERENCES `items` (`item_page_id`, `data_source_id`) ON DELETE CASCADE,
  CONSTRAINT `item_content_link_FK_2` FOREIGN KEY (`content_page_id`, `content_datasource_id`) REFERENCES `contents` (`content_page_id`, `data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.tracks definition

CREATE TABLE `tracks` (
  `track_page_id` varchar(100) NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`track_page_id`,`data_source_id`),
  KEY `tracks_FK` (`data_source_id`),
  CONSTRAINT `tracks_FK` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.track_files definition

CREATE TABLE `track_files` (
  `track_file_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `track_page_id` varchar(100) NOT NULL,
  `data_source_id` varchar(100) NOT NULL,
  `file_name` varchar(100) NOT NULL,
  PRIMARY KEY (`track_file_id`),
  KEY `track_files_FK_1` (`track_page_id`,`data_source_id`),
  CONSTRAINT `track_files_FK_1` FOREIGN KEY (`track_page_id`, `data_source_id`) REFERENCES `tracks` (`track_page_id`, `data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.track_geojson definition

CREATE TABLE `track_geojson` (
  `track_file_id` int(10) unsigned NOT NULL,
  `sub_id` int(10) unsigned NOT NULL,
  `min_zoom` float NOT NULL,
  `max_zoom` float NOT NULL,
  `geojson` geometry NOT NULL,
  PRIMARY KEY (`track_file_id`,`sub_id`),
  CONSTRAINT `track_geojson_FK` FOREIGN KEY (`track_file_id`) REFERENCES `track_files` (`track_file_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 279map_db.original_icons definition

CREATE TABLE `original_icons` (
  `icon_page_id` varchar(100) NOT NULL,
  `caption` varchar(100) DEFAULT NULL,
  `base64` text NOT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  `map_page_id` varchar(100) NOT NULL,
  PRIMARY KEY (`icon_page_id`),
  KEY `original_icons_FK` (`map_page_id`),
  CONSTRAINT `original_icons_FK` FOREIGN KEY (`map_page_id`) REFERENCES `map_page_info` (`map_page_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
