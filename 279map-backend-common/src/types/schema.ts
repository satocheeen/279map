import { Auth, DataSourceKindType, DataSourceLinkableContent, MapKind } from '../279map-common';
import { SnsOptions } from '../sns';

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
    last_edited_time: string;
}
export interface DataSourceConnection {
    type: string;
}
// 各地図での仕様形式。realでItemContent、virtualでContentになるケースなどを想定して、地図種別ごとに設定するようにしている。
export type DataSourceKind = {
    real?: DataSourceKindType;
    virtual?: DataSourceKindType;
}
export type DataSourceTable = {
    data_source_id: string;
    name: string;
    kind_real?: DataSourceKind;
    kind_virtual?: DataSourceKind;
    linkable_content: DataSourceLinkableContent;
    readonly: boolean;
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
    map_kind: MapKind;
    name: string | null;
    location: {x: number; y: number;};   // Geometry
    geo_properties: string;       // GeoPropertiesのJSON文字列
    last_edited_time: string;
}
export type ContentsTable = {
    content_page_id: string;
    data_source_id: string;
    parent_id?: string;         // 親コンテンツID
    parent_datasource_id?: string;         // 親コンテンツデータソースID
    title?: string;
    contents?: string | ContentsInfo;   // 登録時はstring。取得時はContentsInfo
    thumbnail?: string;
    category?: string | string[];   // 登録時はstring。取得時はCategory文字配列
    date?: Date;
    supplement?: string | SnsOptions;      // 登録時はstring、取得時はSnsOptions
    last_edited_time: string;
}
export type ItemContentLink = {
    item_page_id: string;
    item_datasource_id: string;
    content_page_id: string;
    content_datasource_id: string;
    last_edited_time: string;
}
/**
 * conteentsテーブル内のcontentsカラムを構成する情報
 */
 export type ContentsInfo = {
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