/**
 * システム全体で共通的に使用する型定義。
 * backend-main配下のものが原本。
 * 他プロジェクトへは、npm run codegenスクリプトにてコピーされる。
 */


// export type DataId = {
//     id: string;
//     dataSourceId: string;
// }
export type DataId = number;

export enum MapKind {
    Real = 'Real',
    Virtual = 'Virtual'
}

export type IconKey = {
    type: 'system' | 'original';
    id: string;
}

export type IconDefine = IconKey & {
    caption: string;
    /** 画像ファイルパス */
    imagePath: string;

    /** SVG画像の場合に、my-colorクラスを付与しているノードに対して、fill設定が行われる */
    defaultColor?: string;  // デフォルト塗りつぶし色 (将来的にタグなどによる自動色設定や、ユーザによる色指定をできるようにする予定)

    useMaps: MapKind[];
}

/**
 * 地物種別
 * (DBに登録するので、後から増減可能なように文字列型にしている)
 */
export enum FeatureType {
    STRUCTURE = 'STRUCTURE',
    ROAD = 'ROAD',
    EARTH = 'EARTH',
    FOREST = 'FOREST',
    AREA = 'AREA',
    TRACK = 'TRACK',
    STATIC_IMAGE = 'STATIC_IMAGE',
}

/* OSM等で管理されているFeatureを特定する情報 */
export type GeocoderIdInfo = {
    /* OSMで管理されているFeatureを特定する情報 */
    map: 'osm';
    osm_type: string;
    osm_id: number;
} | {
    /* Mapboxで管理されているFeatureを特定する情報 */
    map: 'mapbox';
    id: string;
}

export type GeoProperties = {
    featureType: FeatureType.STRUCTURE;
    icon?: IconKey;
    mark?: {
        key: IconKey;      // 強調マークID
        speed: number;      // アニメーション速度
    }
} | {
    featureType: FeatureType.ROAD;
    lineJson: GeoJSON.Feature;  // 元のLine
    width: string;  // RoadWidth.key
} | {
    featureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    radius?: number;
} | {
    featureType: FeatureType.AREA;
    geocoderId?: GeocoderIdInfo;    // OSM等で管理されているFeatureの場合
} | {
    featureType: FeatureType.TRACK;
    min_zoom: number;
    max_zoom:  number;
} | (
    {
        featureType: FeatureType.STATIC_IMAGE;
        opacity?: number;
    } & (
        {
            url: string;
        } | {
            base64: string;
        }
    )
)

/**
 * データソースのLocation種別
 */
export enum DatasourceLocationKindType {
    VirtualItem = 'VirtualItem',    // 村マップ上の建物や土地に関する情報を格納するデータソース
    RealItem = 'RealItem',          // 世界地図上のピンやエリア
    Track = 'Track',                // 世界地図上の軌跡 
    StaticImage = 'StaticImage',    // 固定イメージ
    None = 'None',                  // 位置情報を持たないデータソースの場合
}

/**
 * アイテムDatasourceに関する情報
 */
export type ItemDatasourceConfig = {
    kind: DatasourceLocationKindType.Track | DatasourceLocationKindType.VirtualItem;
} | {
    kind: DatasourceLocationKindType.RealItem;
    drawableArea: boolean;  // trueの場合、エリア描画可能。falseの場合は、ピンのみ描画可能。
    defaultIcon?: IconKey;
} | {
    kind: DatasourceLocationKindType.StaticImage;
}

/**
 * コンテンツDatasourceに関する情報
 */
export type ContentDatasourceConfig = {
    linkableToItem: boolean;        // trueの場合、対になるアイテム以外への割り当て可能
    readonly?: boolean;             // trueの場合、ユーザによる編集不可能
    // linkableChildContents: boolean; // trueの場合、子コンテンツの追加が可能
    fields: ContentFieldDefine[];
}

/**
 * コンテンツ関連の項目情報
 */
export type ContentFieldDefine = {
    key: string;

    // stringは１行、textは複数行. link=他アイテムへのリンク項目
    type: 'title' | 'string' | 'date' | 'url' | 'text' | 'category' | 'single-category' | 'number' | 'image';
    label: string;
    readonly?: boolean;
} | {
    key: string;
    type: 'link'
    label: string;
    databaseId: string;
}

/**
 * 位置（item or track）関連の項目情報
 * TODO: ODBAの管轄にする
 */
export type LocationFieldDefine = {
    key: string;
    type: 'latitude' | 'longitude' | 'radius'
     | 'address' | 'geojson' | 'gpx-file'
     | 'mark' | 'mark-speed'    // 建物の上に表示するマーク
     | 'static-image' | 'extent' | 'static-image-opacity'   // 重ね合わせ画像定義
     ;
}

export type ContentValue = {
    type: 'title' | 'string' | 'text' | 'date' | 'url';
    value: string;
} | {
    type: 'number';
    value: number;
} | {
    type: 'category' | 'single-category';
    value: string[];
} | {
    type: 'image';
    value: DataId[];
} | {
    type: 'link';
    value: {
        dataId: DataId;
        name: string;
        // 属しているアイテム
        belongingItem?: {
            itemId: DataId;
            name: string;
            mapKind: MapKind; // 当該アイテムが存在する地図種別
        }
    }[];
}

export type ContentValueForRegist = Exclude<ContentValue, {type:'image'} | {type:'link'}> | {
    type: 'image';
    value: string[];    // 画像URL
} | {
    type: 'link';
    value: DataId[];
};

/**
 * Backendとcore間でやり取りする形式
 * - 通信データ量を削減するため、valueのみを渡している
 * - typeとの紐づけはデータを受け取った側で行う
 */
// 登録・更新用（DBのcontents内もこの形式で格納されている）
export type ContentValueMapInput = {[key: string]: ContentValueForRegist['value']};
// 参照用
export type ContentValueMap = {[key: string]: ContentValue['value']};
