import { Auth, MapKind } from '../279map-common';

export enum PublicRange {
    Public = 'Public',
    Private = 'Private'
}
export type MapPageInfoTable = {
    map_page_id: string;
    alias?: string;
    title: string;
    use_maps: string;   // MapKindをカンマ区切り
    default_map: MapKind;
    public_range: PublicRange;
    odba_name: string;
    last_edited_time: string;
}
export enum DataSourceKind {
    VirtualItem = 'VirtualItem',
    RealItem = 'RealItem',
    Content = 'Content',
    RealItemContent = 'RealItemContent',
    RealTrack = 'RealTrack',
}
export interface DataSourceConnection {
    type: string;
}
export type DataSourceTable = {
    data_source_id: string;
    kind: DataSourceKind;
    name: string;
    editable: boolean;
    connection: string | DataSourceConnection;  // 登録時はstring、取得時はDataSourceConnection
    last_edited_time: string;
}
export type MapDataSourceLinkTable = {
    map_page_id: string;
    data_source_id: string;
    last_edited_time: string;
}
export type MapUserTable = {
    map_page_id: string;
    user_id: string;
    auth_lv: Auth;
    name: string;
}
export type TracksTable = {
    track_page_id: string;
    data_source_id: string;
    name: string;
    last_edited_time: string;
}
export type TrackFilesTable = {
    track_file_id: number;
    track_page_id: string;
    data_source_id: string;
    file_name: string;
}
export type TrackGeoJsonTable = {
    track_file_id: number;
    sub_id: number;
    min_zoom: number;
    max_zoom: number;
    geojson: any;
}
export type ItemsTable = {
    item_page_id: string;
    data_source_id: string;
    name: string | null;
    location: {x: number; y: number;};   // Geometry
    geo_properties: string;       // GeoPropertiesのJSON文字列
    last_edited_time: string;
}
export type ContentsTable = {
    content_page_id: string;
    data_source_id: string;
    title?: string;
    contents?: string;   // ContentsInfoのJSON文字列
    thumbnail?: string;
    category?: string;   // Category配列のJSON文字列
    date?: Date;
    supplement?: string;      // ContentOptionのJSON文字列
    parent_id?: string;         // 親コンテンツID
    parent_data_sourceid?: string;         // 親コンテンツデータソースID
    readonly: boolean;
    last_edited_time: string;
}
export type ItemContentLink = {
    item_page_id: string;
    item_data_source_id: string;
    content_page_id: string;
    content_data_source_id: string;
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
    map_page_id: string;
    caption: string;
    base64: string;
    last_edited_time: string;
}