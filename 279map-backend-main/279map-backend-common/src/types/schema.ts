import { MapPageOptions } from '../graphql/__generated__/types';
import { ContentDatasourceConfig, MapKind, ContentFieldDefine, DatasourceLocationKindType, LocationFieldDefine, IconKey, ContentValueMapInput, DataId } from '../types-common/common-types';

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
    options?: MapPageOptions;

    // 地図説明
    description?: string;
    thumbnail?: string;

    // ODBAで使用するための接続関連情報
    odba_connection: OdbaConnection;
    last_edited_time: string;
}
export type MapPageInfoTableForRegist = Omit<MapPageInfoTable, 'options' | 'odba_connection'> & {
    options?: string;
    odba_connection: string;
}

export interface OdbaConnection {
    type: string;   // ODBA識別名称
    // 他に必要な項目は、ODBA内で個別に設定する
}
export type ContentsDefine = {
    fields: ContentFieldDefine[];
    sort?: {
        order: 'asc' | 'desc';
    } & (
        {
            type: 'field';
            fieldKey: string;
        } | {
            type: 'update_datetime';
        }
    )
}
export type DataSourceTable = {
    data_source_id: string;

    location_define: LocationFieldDefine | null;
    contents_define: ContentsDefine | null;

    // ODBAで使用するための接続関連情報
    odba_connection: OdbaConnection;

    last_edited_time: string;
} & (
    {
        location_kind: DatasourceLocationKindType.None | DatasourceLocationKindType.RealItem | DatasourceLocationKindType.Track | DatasourceLocationKindType.StaticImage;
        config: DatasourceTblConfigForContent;
    } | {
        location_kind: DatasourceLocationKindType.VirtualItem;
        config: {}
    }
)
export type DataSourceTableForRegist = Omit<DataSourceTable, 'config' | 'location_define' | 'contents_define' | 'odba_connection'> & {
    config: string;

    location_define: string | null;
    contents_define: string | null;

    // ODBAで使用するための接続関連情報
    odba_connection: string;
}

export type DatasourceTblConfigForContent = Omit<ContentDatasourceConfig, 'fields' | 'linkableToItem'>;

export type MapDataSourceLinkTable = {
    map_page_id: string;
    data_source_id: string;
    datasource_name: string;
    group_name?: string[];
    order_num?: number;
    mdl_config: MapDataSourceLinkConfig;
    last_edited_time: string;
}
export type MapDataSourceLinkTableForRegist = Omit<MapDataSourceLinkTable, 'mdl_config' | 'group_name'> & {
    group_name?: string;
    mdl_config: string;
}

/**
 * コンテンツのカラム定義等を格納
 */
export type MapDataSourceLinkConfig = {
    location_kind: DatasourceLocationKindType.RealItem;
    initialVisible: boolean;    // レイヤ初期表示状態
    contentFieldKeyList: string[];  // 当該地図で使用するコンテンツ項目のキー一覧
    unclickable?: boolean;      // trueの場合、クリック不可
    defaultIconKey?: IconKey;
} | {
    location_kind: DatasourceLocationKindType.Track | DatasourceLocationKindType.StaticImage;
    initialVisible: boolean;    // レイヤ初期表示状態
    contentFieldKeyList: string[];  // 当該地図で使用するコンテンツ項目のキー一覧
} | {
    location_kind: DatasourceLocationKindType.VirtualItem;
    contentFieldKeyList: string[];  // 当該地図で使用するコンテンツ項目のキー一覧
} | {
    location_kind: DatasourceLocationKindType.None;
    contentFieldKeyList: string[];  // 当該地図で使用するコンテンツ項目のキー一覧
}

export type DatasTable = {
    data_id: DataId;
    data_source_id: string;
    original_id: string;
    last_edited_time: string;
}

export type GeometryItemsTable = {
    geometry_item_id: number;
    data_id: DataId;
    min_zoom: number;
    max_zoom: number;
    feature: any;   // Geometry
    geo_properties: string;       // GeoPropertiesのJSON文字列
    static_image?: string;      // StaticImageの場合、Base64文字列
}

export type ContentsTable = {
    data_id: DataId;
    contents?: ContentValueMapInput;
    date?: string;
}
export type ContentsTableForRegist = Omit<ContentsTable, 'contents' | 'date'> & {
    contents?: string;
    date?: Date;
}
export type ImagesTable = {
    image_id: number;
    data_id: DataId;
    field_key: string;
    thumbnail: string;
    medium: string;
}

export type DataLinkTable = {
    from_data_id: DataId;
    from_field_key: string;
    to_data_id: DataId;
    last_edited_time: string;
}

export type OriginalIconsTable = {
    icon_page_id: string;
    map_page_id: string;
    use_maps: string;   // MapKindをカンマ区切り
    caption: string;
    base64: string;
    last_edited_time: string;
}

export type ContentBelongMapView = {
    content_id: DataId;
    item_id: DataId;
    deep: number;
    item_datasource_id: string;
    map_kind: MapKind;
    map_page_id: string;
}
