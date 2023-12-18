import { DataId } from "279map-common";

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
    // ユーザ一覧情報が更新された場合
    type: 'userlist-update';
    subtype?: undefined;
} | {
    // 指定のアイテム配下のコンテンツに変更（登録・更新・削除）があった場合
    type: 'childcontents-update';
    subtype: DataId;
}
