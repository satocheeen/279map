import { CurrentMap } from "../types";
import { DataId } from "../types-common/common-types";
import { OdbaAPIFunc } from "./api-initializer";
import { OdbaGetImageUrlParam, OdbaGetLinkableContentsResult, OdbaGetUnpointDataParam, OdbaGetUnpointDataResult, OdbaLinkContentToItemParam, OdbaRegistContentParam, OdbaRegistDataParam, OdbaRegistItemParam, OdbaRemoveDataParam, OdbaRemoveItemParam, OdbaUpdateContentParam, OdbaUpdateDataParam, OdbaUpdateItemParam } from "./dba-api-interface";

export type UpdateContentLinkCacheParam = {
    currentMap: CurrentMap;
    contentId: DataId;
    parent: {
        itemId: DataId;
    } | {
        contentId: DataId;
    }
}

export default abstract class OdbaInterface {
    abstract registDataOdb: (param: OdbaRegistDataParam) => Promise<DataId>;

    abstract updateDataOdb: (param: OdbaUpdateDataParam) => Promise<boolean>;

    abstract removeDataOdb: (param: OdbaRemoveDataParam) => Promise<boolean>;

    abstract registItemOdb: (param: OdbaRegistItemParam) => Promise<string>;

    abstract updateItemCache: (_: {currentMap: CurrentMap, itemId: DataId}) => Promise<'insert' | 'update'>;

    /**
     * 指定のコンテンツを登録する。
     * ODBの更新、キャッシュDBの更新を行う。
     */
    abstract registContent: (param: OdbaRegistContentParam) => Promise<DataId>;

    abstract removeItemOdb: (param: OdbaRemoveItemParam) => Promise<void>;

    abstract removeItemCache: (_: {currentMap: CurrentMap, itemId: DataId}) => Promise<void>;

    abstract removeContentOdb: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<void>;

    abstract removeContentCache: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<void>;

    abstract updateItemOdb: (param: OdbaUpdateItemParam) => Promise<void>;

    /**
     * 指定のコンテンツを更新する。
     * ODBの更新、キャッシュDBの更新を行う。
     */
    abstract updateContent: (param: OdbaUpdateContentParam) => Promise<void>;

    abstract getUnpointData: OdbaAPIFunc<OdbaGetUnpointDataParam, OdbaGetUnpointDataResult>;

    /**
     * 指定のコンテンツをアイテムまたは親コンテンツに紐づける。
     * ODBの更新、キャッシュDBの更新を行う。
     */
    abstract linkContent: (param: OdbaLinkContentToItemParam) => Promise<void>;

    /**
     * 指定のコンテンツについてアイテムまたは親コンテンツとの接続を解除する。
     * ODBの更新、キャッシュDBの更新を行う。
     */
    abstract unlinkContent: (param: OdbaLinkContentToItemParam) => Promise<void>;

    abstract getImageUrl: (param: OdbaGetImageUrlParam) => Promise<string | undefined>;

    abstract getLinkableContents: (currentMap: CurrentMap) => Promise<OdbaGetLinkableContentsResult>;
}