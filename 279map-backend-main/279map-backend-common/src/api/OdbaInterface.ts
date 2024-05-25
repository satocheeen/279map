import { CurrentMap } from "../types";
import { DataId } from "../types-common/common-types";
import { OdbaAPIFunc } from "./api-initializer";
import { OdbaGetImageUrlParam, OdbaGetLinkableContentsResult, OdbaGetUncachedDataParam, OdbaGetUncachedDataResult, OdbaLinkDataParam, OdbaRegistDataParam, OdbaRemoveDataParam, OdbaUnLinkDataParam, OdbaUpdateDataParam } from "./dba-api-interface";

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
    abstract registData: (param: OdbaRegistDataParam) => Promise<DataId>;

    abstract updateData: (param: OdbaUpdateDataParam) => Promise<boolean>;

    abstract removeData: (param: OdbaRemoveDataParam) => Promise<boolean>;

    abstract getUncachedData: OdbaAPIFunc<OdbaGetUncachedDataParam, OdbaGetUncachedDataResult>;

    /**
     * 指定のコンテンツをアイテムまたは親コンテンツに紐づける。
     * ODBの更新、キャッシュDBの更新を行う。
     */
    abstract linkData: (param: OdbaLinkDataParam) => Promise<void>;

    /**
     * 指定のコンテンツについてアイテムまたは親コンテンツとの接続を解除する。
     * ODBの更新、キャッシュDBの更新を行う。
     */
    abstract unlinkData: (param: OdbaUnLinkDataParam) => Promise<void>;

    abstract getImageUrl: (param: OdbaGetImageUrlParam) => Promise<string | undefined>;

    abstract getLinkableContents: (currentMap: CurrentMap) => Promise<OdbaGetLinkableContentsResult>;
}