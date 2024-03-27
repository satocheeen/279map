import { MapPageOptions, MapKind } from '../graphql/__generated__/types';
// import { SnsOptions } from '../sns';
import { ContentDatasourceConfig, ContentFieldDefine, DatasourceKindType } from '../types-common/common-types';

export enum PublicRange {
    Public = 'Public',
    Private = 'Private'
}
export type MapPageInfoTable = {
    map_page_id: string;
    title: string;
    use_maps: string;   // MapKindをカンマ区切り
    default_map: MapKind;
    public_range: PublicRange;
    options?: string | MapPageOptions;   // 登録時はstring、取得時はMapPageOptions

    // ODBAで使用するための接続関連情報
    odba_connection: string | OdbaConnection;  // 登録時はstring、取得時はDataSourceConnection
    last_edited_time: string;
}
export interface OdbaConnection {
    type: string;   // ODBA識別名称
    // 他に必要な項目は、ODBA内で個別に設定する
}
export type DataSourceTable = {
    data_source_id: string;
    kind: DatasourceKindType;

    // 登録時はstring, 取得時はDatasourceConfig(Contentの場合、fieldsは格納対象外)
    config: string | DatasourceTblConfig;

    // ODBAで使用するための接続関連情報
    odba_connection: string | OdbaConnection;  // 登録時はstring、取得時はDataSourceConnection

    last_edited_time: string;
}
export type DatasourceTblConfig = Omit<ContentDatasourceConfig, 'fields'> | {};

export type MapDataSourceLinkTable = {
    map_page_id: string;
    data_source_id: string;
    datasource_name: string;
    group_name?: string;
    order_num?: number;
    mdl_config: string | MapDataSourceLinkConfig;
    last_edited_time: string;
}
/**
 * コンテンツのカラム定義等を格納
 */
export type MapDataSourceLinkConfig = {
    kind: DatasourceKindType.RealItem | DatasourceKindType.Track;
    initialVisible: boolean;    // 初期表示状態
} | {
    kind: DatasourceKindType.Content;
    fields: ContentFieldDefine[];
} | {
    kind: DatasourceKindType.RealPointContent;
    initialVisible: boolean;    // 初期表示状態
    fields: ContentFieldDefine[];
} | {
    kind: DatasourceKindType.VirtualItem;
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
    parent_id?: string;         // 親コンテンツID
    parent_datasource_id?: string;         // 親コンテンツデータソースID
    title?: string;
    contents?: string | object;   // 登録時はstring。取得時はobject
    category?: string | string[];   // 登録時はstring。取得時はCategory文字配列
    date?: Date | string;   // 登録時はDate。取得時はstring
    supplement?: string; // | SnsOptions;      // 登録時はstring、取得時はSnsOptions
    last_edited_time: string;
}
export type ImagesTable = {
    image_id: number;
    content_page_id: string;
    data_source_id: string;
    field_key: string;
    thumbnail: string;
    medium: string;
}

export type ItemContentLink = {
    item_page_id: string;
    item_datasource_id: string;
    content_page_id: string;
    content_datasource_id: string;
    last_edited_time: string;
}

export type OriginalIconsTable = {
    icon_page_id: string;
    map_page_id: string;
    caption: string;
    base64: string;
    last_edited_time: string;
}