import { DataId } from "279map-common";
import { CurrentMap } from "../types";
import { OdbaAPIFunc } from "./api-initializer";
import { GetUnpointDataParam, GetUnpointDataResult, LinkContentToItemParam, RegistContentParam, RegistItemParam, RemoveContentParam, RemoveItemParam, UpdateContentParam, UpdateItemParam } from "./dba-api-interface";

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
    abstract registItemOdb: (param: RegistItemParam) => Promise<DataId>;

    abstract updateItemCache: (_: {currentMap: CurrentMap, itemId: DataId}) => Promise<'insert' | 'update'>;

    abstract registContentOdb: (param: RegistContentParam) => Promise<DataId>;

    abstract updateContentCache: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<'insert' | 'update'>;

    abstract removeItemOdb: (param: RemoveItemParam) => Promise<void>;

    abstract removeItemCache: (_: {currentMap: CurrentMap, itemId: DataId}) => Promise<void>;

    abstract removeContentOdb: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<void>;

    abstract removeContentCache: (_: {currentMap: CurrentMap, contentId: DataId}) => Promise<void>;

    abstract updateItemOdb: (param: UpdateItemParam) => Promise<void>;

    abstract updateContentOdb: (param: UpdateContentParam) => Promise<void>;

    abstract getUnpointData: OdbaAPIFunc<GetUnpointDataParam, GetUnpointDataResult>;

    abstract linkContentOdb: (param: LinkContentToItemParam) => Promise<void>;

    abstract unlinkContentOdb: (param: LinkContentToItemParam) => Promise<void>;

    abstract updateContentLinkCache: (param: UpdateContentLinkCacheParam) => Promise<void>;

    abstract getImageUrl: OdbaAPIFunc<{id: DataId}, string | undefined>;
}