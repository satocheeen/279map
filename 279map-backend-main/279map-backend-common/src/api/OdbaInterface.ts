import { DataId } from "../graphql/__generated__/types";
import { CurrentMap } from "../types";
import { OdbaAPIFunc } from "./api-initializer";
import { OdbaGetLinkableContentsResult, OdbaGetUnpointDataParam, OdbaGetUnpointDataResult, OdbaLinkContentDatasourceToMapParam, OdbaLinkContentToItemParam, OdbaRegistContentParam, OdbaRegistItemParam, OdbaRemoveContentParam, OdbaRemoveItemParam, OdbaUnlinkContentDatasourceFromMapParam, OdbaUpdateContentParam, OdbaUpdateItemParam } from "./dba-api-interface";

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
    abstract registItemOdb: (param: OdbaRegistItemParam) => Promise<DataId>;

    abstract updateItemCache: (_: {currentMap: CurrentMap, itemId: DataId}) => Promise<'insert' | 'update'>;

    abstract registContentOdb: (param: OdbaRegistContentParam) => Promise<DataId>;

    abstract updateContentCache: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<'insert' | 'update'>;

    abstract removeItemOdb: (param: OdbaRemoveItemParam) => Promise<void>;

    abstract removeItemCache: (_: {currentMap: CurrentMap, itemId: DataId}) => Promise<void>;

    abstract removeContentOdb: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<void>;

    abstract removeContentCache: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<void>;

    abstract updateItemOdb: (param: OdbaUpdateItemParam) => Promise<void>;

    abstract updateContentOdb: (param: OdbaUpdateContentParam) => Promise<void>;

    abstract getUnpointData: OdbaAPIFunc<OdbaGetUnpointDataParam, OdbaGetUnpointDataResult>;

    abstract linkContentOdb: (param: OdbaLinkContentToItemParam) => Promise<void>;

    abstract unlinkContentOdb: (param: OdbaLinkContentToItemParam) => Promise<void>;

    abstract updateContentLinkCache: (param: UpdateContentLinkCacheParam) => Promise<void>;

    abstract getImageUrl: OdbaAPIFunc<{id: DataId}, string | undefined>;

    abstract getLinkableContents: (currentMap: CurrentMap) => Promise<OdbaGetLinkableContentsResult>;

    abstract linkContentDatasourceToMap: (param: OdbaLinkContentDatasourceToMapParam) => Promise<void>;

    abstract unlinkContentDatasourceFromMap: (param: OdbaUnlinkContentDatasourceFromMapParam) => Promise<void>;
}