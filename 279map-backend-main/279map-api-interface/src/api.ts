import { DataId } from "279map-common";

/**
 * Publishメッセージ（地図に対するもの）
 */
export type PublishMapMessage = {
    // 指定のアイテム配下のコンテンツに変更（登録・更新・削除）があった場合
    type: 'childcontents-update';
    subtype: DataId;
}
