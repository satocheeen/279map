SET CHARSET UTF8;

INSERT INTO 279map_db.map_page_info
(map_page_id, title, last_edited_time, alias, edit_auth_hash, default_map, use_maps)
VALUES('testmap', 'Testマップ', '2022-10-17T00:00:00.000', NULL, NULL, 'Real', 'Virtual,Real');

INSERT INTO 279map_db.contents_db_info
(map_page_id, contents_db_id, kind, last_edited_time, sync_service_name)
VALUES('testmap', 'location', 'Item', '2022-10-17T00:00:00.000Z', 'TEST_MAP');
