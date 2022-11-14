import { MapKind } from '279map-common/dist/types';
export declare type Kind = 'GPX' | 'Trace' | 'Item' | 'Content' | 'Icon';
export declare type MapPageInfoTable = {
    map_page_id: string;
    alias?: string;
    title: string;
    use_maps: string;
    default_map: MapKind;
    edit_auth_hash?: string;
    last_edited_time: string;
};
export declare type ContentsDbInfoTable = {
    contents_db_id: string;
    map_page_id: string;
    kind: Kind;
    sync_service_name: string;
    last_edited_time: string;
};
export declare type TracksTable = {
    track_page_id: string;
    contents_db_id: string;
    name: string;
    last_edited_time: string;
};
export declare type TrackFilesTable = {
    track_file_id: number;
    track_page_id: string;
    file_name: string;
};
export declare type TrackGeoJsonTable = {
    track_file_id: number;
    sub_id: number;
    min_zoom: number;
    max_zoom: number;
    geojson: string;
};
export declare type ItemsTable = {
    item_page_id: string;
    contents_db_id: string;
    location: {
        x: number;
        y: number;
    };
    geo_properties: string;
    map_kind: MapKind;
    content_page_id: string | null;
    last_edited_time: string;
};
export declare type ContentsTable = {
    content_page_id: string;
    contents_db_id: string;
    title?: string;
    contents?: string;
    thumbnail?: string;
    category?: string;
    date?: Date;
    supplement?: string;
    parent_id?: string;
    last_edited_time: string;
};
/**
 * conteentsテーブル内のcontentsカラムを構成する情報
 */
export declare type ContentsInfo = {
    content?: string;
    url?: string;
    videoUrl?: string;
};
export declare type OriginalIconsTable = {
    icon_page_id: string;
    contents_db_id: string;
    caption: string;
    base64: string;
    last_edited_time: string;
};
