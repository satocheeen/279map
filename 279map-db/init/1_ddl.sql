DROP TABLE IF EXISTS map_page_info CASCADE;
DROP TABLE IF EXISTS contents_db_info CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS track_files CASCADE;
DROP TABLE IF EXISTS track_geojson CASCADE;
DROP TABLE IF EXISTS original_icons CASCADE;

-- 279map_db.map_page_info definition

CREATE TABLE `map_page_info` (
  `map_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_edited_time` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alias` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_map` enum('Real','Virtual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `use_maps` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_range` enum('Public','Private') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`map_page_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.contents_db_info definition

CREATE TABLE `contents_db_info` (
  `map_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contents_db_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('Point','GPX','Trace','Item','Content','Icon') COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_edited_time` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sync_service_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`contents_db_id`),
  KEY `contents_db_info_FK` (`map_page_id`),
  CONSTRAINT `contents_db_info_FK` FOREIGN KEY (`map_page_id`) REFERENCES `map_page_info` (`map_page_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.contents definition

CREATE TABLE `contents` (
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contents` text COLLATE utf8mb4_unicode_ci,
  `thumbnail` text COLLATE utf8mb4_unicode_ci,
  `content_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_edited_time` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` text COLLATE utf8mb4_unicode_ci,
  `date` datetime DEFAULT NULL,
  `parent_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplement` text COLLATE utf8mb4_unicode_ci,
  `contents_db_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`content_page_id`),
  KEY `contents_FK` (`parent_id`),
  KEY `contents_FK_1` (`contents_db_id`),
  CONSTRAINT `contents_FK` FOREIGN KEY (`parent_id`) REFERENCES `contents` (`content_page_id`) ON DELETE CASCADE,
  CONSTRAINT `contents_FK_1` FOREIGN KEY (`contents_db_id`) REFERENCES `contents_db_info` (`contents_db_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.items definition

CREATE TABLE `items` (
  `location` geometry NOT NULL,
  `contents_db_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_edited_time` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `geo_properties` text COLLATE utf8mb4_unicode_ci,
  `map_kind` enum('Real','Virtual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_page_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`item_page_id`),
  KEY `point_contents_FK` (`contents_db_id`) USING BTREE,
  KEY `items_FK` (`content_page_id`),
  CONSTRAINT `items_FK` FOREIGN KEY (`content_page_id`) REFERENCES `contents` (`content_page_id`) ON DELETE CASCADE,
  CONSTRAINT `points_FK_copy` FOREIGN KEY (`contents_db_id`) REFERENCES `contents_db_info` (`contents_db_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.tracks definition

CREATE TABLE `tracks` (
  `track_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contents_db_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_edited_time` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`track_page_id`),
  KEY `tracks_FK` (`contents_db_id`),
  CONSTRAINT `tracks_FK` FOREIGN KEY (`contents_db_id`) REFERENCES `contents_db_info` (`contents_db_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.track_files definition

CREATE TABLE `track_files` (
  `track_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `track_file_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`track_file_id`),
  KEY `track_files_FK` (`track_page_id`),
  CONSTRAINT `track_files_FK` FOREIGN KEY (`track_page_id`) REFERENCES `tracks` (`track_page_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.track_geojson definition

CREATE TABLE `track_geojson` (
  `track_file_id` int(10) unsigned NOT NULL,
  `sub_id` int(10) unsigned NOT NULL,
  `min_zoom` float NOT NULL,
  `max_zoom` float NOT NULL,
  `geojson` geometry NOT NULL,
  PRIMARY KEY (`track_file_id`,`sub_id`),
  CONSTRAINT `track_geojson_FK` FOREIGN KEY (`track_file_id`) REFERENCES `track_files` (`track_file_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 279map_db.original_icons definition

CREATE TABLE `original_icons` (
  `icon_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `base64` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_edited_time` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contents_db_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`icon_page_id`),
  KEY `original_icons_FK` (`contents_db_id`),
  CONSTRAINT `original_icons_FK` FOREIGN KEY (`contents_db_id`) REFERENCES `contents_db_info` (`contents_db_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 279map_db.map_user definition

CREATE TABLE `map_user` (
  `map_page_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_lv` enum('None','View','Edit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`map_page_id`,`user_id`),
  CONSTRAINT `map_user_FK` FOREIGN KEY (`map_page_id`) REFERENCES `map_page_info` (`map_page_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;