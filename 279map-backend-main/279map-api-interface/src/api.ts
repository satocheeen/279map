import { Auth, CategoryDefine, ContentsDefine, DataId, DataSourceInfo, EventDefine, Extent, GeocoderId, GeoProperties, IconDefine, ItemDefine, MapKind, ServerConfig, UnpointContent, User } from "279map-common";
import { GeoJsonObject, Position } from "geojson";
import { APIDefine, ContentAttr, SnsPreviewPost, MapDefine } from '279map-common';
import { FilterDefine, DataSourceGroup } from "279map-common";

export const GetMapListAPI = {
    uri: 'getmaplist',
    method: 'get',
    resultType: 'json',
} as APIDefine<void, MapInfo[]>;

export type MapInfo = {
    mapId: string;
    name: string;
};

export const ConnectAPI = {
    uri: 'connect',
    method: 'get',
    resultType: 'json',
} as APIDefine<ConnectParam, ConnectResult>;
export type ConnectParam = {
    mapId: string;
}
export type ConnectResult = {
    mapDefine: MapDefine;
    sid: string;   // セッションID
    userId?: string;
}

/**
 * Publishメッセージ（ユーザに対するもの）
 */
export type PublishUserMessage = {
    // ユーザ権限に更新があった場合
    type: 'update-userauth';
}

/**
 * Publishメッセージ（地図に対するもの）
 */
export type PublishMapMessage = {
    // 地図にアイテム追加された場合
    type: 'mapitem-insert';
    subtype?: undefined;
    targets: {
        id: DataId;
        wkt: string; // 追加された範囲
    }[];
} | {
    // 地図上のアイテムが更新された場合
    type: 'mapitem-update';
    subtype?: undefined;
    targets: {
        id: DataId;
        wkt: string;    // 更新後範囲
    }[];
} | {
    // 地図上のアイテムが削除された場合
    type: 'mapitem-delete';
    subtype?: undefined;
    itemPageIdList: DataId[];
} | {
    // ユーザ一覧情報が更新された場合
    type: 'userlist-update';
    subtype?: undefined;
} | {
    // 指定のアイテム配下のコンテンツに変更（登録・更新・削除）があった場合
    type: 'childcontents-update';
    subtype: DataId;
} | {
    // 地図定義に変更があった場合
    type: 'mapinfo-update';
    subtype?: undefined;
}
