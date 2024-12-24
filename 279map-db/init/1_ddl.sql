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
  `location_kind` enum('VirtualItem','RealItem','Track','StaticImage','None') NOT NULL,
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
  `group_name` json DEFAULT NULL,
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
  `data_id` varchar(50) NOT NULL,
  `data_source_id` varchar(100) DEFAULT NULL,
  `original_id` varchar(100) NOT NULL COMMENT '出典元データのID。ODBAで登録・更新を行う際に参照する用途。',
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`data_id`),
  UNIQUE KEY `datas_UN` (`data_source_id`,`original_id`),
  KEY `datas_FK` (`data_source_id`),
  CONSTRAINT `datas_FK` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`data_source_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=600 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.contents definition

CREATE TABLE `contents` (
  `data_id` varchar(50) NOT NULL,
  `contents` json DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`data_id`),
  CONSTRAINT `contents_FK` FOREIGN KEY (`data_id`) REFERENCES `datas` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.geometry_items definition

CREATE TABLE `geometry_items` (
  `data_id` varchar(50) NOT NULL,
  `geometry_item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `min_zoom` float NOT NULL,
  `max_zoom` float NOT NULL,
  `feature` geometry NOT NULL,
  `geo_properties` text,
  `static_image` mediumtext,
  PRIMARY KEY (`geometry_item_id`),
  KEY `items_sub_FK` (`data_id`),
  CONSTRAINT `geometry_items_FK` FOREIGN KEY (`data_id`) REFERENCES `datas` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.images definition

CREATE TABLE `images` (
  `image_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `data_id` varchar(50) NOT NULL,
  `thumbnail` mediumtext NOT NULL,
  `medium` mediumtext NOT NULL,
  `field_key` varchar(100) NOT NULL COMMENT '対応するコンテンツFieldのキー',
  PRIMARY KEY (`image_id`),
  KEY `images_FK` (`data_id`),
  CONSTRAINT `images_FK` FOREIGN KEY (`data_id`) REFERENCES `contents` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


-- 279map_db.data_link definition

CREATE TABLE `data_link` (
  `from_data_id` varchar(50) NOT NULL,
  `from_field_key` varchar(50) NOT NULL,
  `to_data_id` varchar(50) NOT NULL,
  `last_edited_time` varchar(100) NOT NULL,
  PRIMARY KEY (`from_data_id`,`from_field_key`, `to_data_id`),
  KEY `data_link_FK_1` (`to_data_id`),
  CONSTRAINT `data_link_FK` FOREIGN KEY (`from_data_id`) REFERENCES `datas` (`data_id`) ON DELETE CASCADE,
  CONSTRAINT `data_link_FK_1` FOREIGN KEY (`to_data_id`) REFERENCES `datas` (`data_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 279map_db.transaction_queue definition

CREATE TABLE `transaction_queue` (
  `id` char(36) NOT NULL,
  `session_key` varchar(100) NOT NULL,
  `operation` varchar(100) NOT NULL,
  `param` json NOT NULL,
  `status` enum('Pending','Failed') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- コンテンツの属する地図一覧View
create view content_belong_map as 
  select 
    temp.*,
    ds.data_source_id as item_datasource_id,
    case
      when ds.location_kind = 'VirtualItem' COLLATE utf8mb4_bin then 'Virtual'
      COLLATE utf8mb4_bin else 'Real'
    end as map_kind,
    mdl.map_page_id	
  from (
    -- アイテムと直接紐づいているコンテンツ
    select 
      c.data_id as content_id,
      d.data_id as item_id,
      0 as deep
    from contents c
    inner join datas d on d.data_id = c.data_id 
    where EXISTS (
      select * from geometry_items gi 
      where gi.data_id = c.data_id 
    )
    union
   -- アイテムから参照されているコンテンツ(1階層)
    select
      dl.to_data_id as content_id,
      dl.from_data_id as item_id,
      1 as deep
    from data_link dl 
    inner join geometry_items gi2 on gi2.data_id = dl.from_data_id 
    union
   -- アイテムから参照されているコンテンツ(2階層)
    select
      dl.to_data_id as content_id,
      dl2.from_data_id as item_id,
      2 as deep
    from data_link dl
    inner join data_link dl2 on dl.from_data_id = dl2.to_data_id 
    -- まだ登場していないコンテンツに絞る
    where not EXISTS (
	    select
	      dl.to_data_id as content_id,
	      dl.from_data_id as item_id
	    from data_link dl_lv1
	    inner join geometry_items gi2 on gi2.data_id = dl_lv1.from_data_id 
    )
  ) as temp
  inner join datas d2 on d2.data_id = temp.item_id
  inner join data_source ds on ds.data_source_id = d2.data_source_id 
  inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
  inner join contents ci on ci.data_id = temp.item_id 
  inner join contents cc on cc.data_id = temp.content_id
;