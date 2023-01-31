import { MapKind } from '279map-common';

// NotionDB種類
export type Kind = 'GPX' | 'Trace' | 'Item' | 'Content' | 'Icon';

export type MapPageInfoTable = {
    map_page_id: string;
    alias?: string;
    title: string;
    use_maps: string;   // MapKindをカンマ区切り
    default_map: MapKind;
    edit_auth_hash?: string;
    last_edited_time: string;
}
export type ContentsDbInfoTable = {
    contents_db_id: string;
    map_page_id: string;
    kind: Kind;
    sync_service_name: string;
    last_edited_time: string;
}
export type TracksTable = {
    track_page_id: string;
    contents_db_id: string;
    name: string;
    last_edited_time: string;
}
export type TrackFilesTable = {
    track_file_id: number;
    track_page_id: string;
    file_name: string;
}
export type TrackGeoJsonTable = {
    track_file_id: number;
    sub_id: number;
    min_zoom: number;
    max_zoom: number;
    geojson: string;
}
export type ItemsTable = {
    item_page_id: string;
    contents_db_id: string;
    name: string | null;
    location: {x: number; y: number;};   // Geometry
    geo_properties: string;       // GeoPropertiesのJSON文字列
    map_kind: MapKind;
    content_page_id: string | null;
    last_edited_time: string;
}
export type ContentsTable = {
    content_page_id: string;
    contents_db_id: string;
    title?: string;
    contents?: string;   // ContentsInfoのJSON文字列
    thumbnail?: string;
    category?: string;   // Category配列のJSON文字列
    date?: Date;
    supplement?: string;      // ContentOptionのJSON文字列
    parent_id?: string;         // 親コンテンツID
    last_edited_time: string;
}
/**
 * conteentsテーブル内のcontentsカラムを構成する情報
 */
 export type ContentsInfo = {
    // date?: string;
    content?: string;
    url?: string;
    videoUrl?: string;
}

export type OriginalIconsTable = {
    icon_page_id: string;
    contents_db_id: string;
    caption: string;
    base64: string;
    last_edited_time: string;
}