import { CurrentMap } from "../types";
import { OdbaAPIFunc } from "./api-initializer";
import { GetUnpointDataParam, GetUnpointDataResult, LinkContentToItemParam, RegistContentParam, RegistItemParam, RemoveContentParam, RemoveItemParam, UpdateContentParam, UpdateItemParam } from "./dba-api-interface";

type UpdateItemContentLinkCacheParam = {
    currentMap: CurrentMap;
    contentId: string;
    itemId: string;
}

export default abstract class OdbaInterface {
    abstract registItemOdb: (param: RegistItemParam) => Promise<string>;

    abstract updateItemCache: (_: {currentMap: CurrentMap, itemId: string}) => Promise<'insert' | 'update'>;

    abstract registContentOdb: (param: RegistContentParam) => Promise<string>;

    abstract updateContentCache: (_: {currentMap: CurrentMap, contentId: string}) => Promise<'insert' | 'update'>;

    abstract removeItemOdb: (param: RemoveItemParam) => Promise<void>;

    abstract removeItemCache: (_: {currentMap: CurrentMap, itemId: string}) => Promise<void>;

    abstract removeContentOdb: (_: {currentMap: CurrentMap, contentId: string}) => Promise<void>;

    abstract removeContentCache: (_: {currentMap: CurrentMap, contentId: string}) => Promise<void>;

    abstract updateItemOdb: (param: UpdateItemParam) => Promise<void>;

    abstract updateContentOdb: (param: UpdateContentParam) => Promise<void>;

    abstract getUnpointData: OdbaAPIFunc<GetUnpointDataParam, GetUnpointDataResult>;

    abstract linkContentOdb: (param: LinkContentToItemParam) => Promise<void>;

    abstract unlinkContentOdb: (param: LinkContentToItemParam) => Promise<void>;

    abstract updateItemContentLinkCache: (param: UpdateItemContentLinkCacheParam) => Promise<void>;

    abstract getImageUrl: OdbaAPIFunc<{id: string}, string | undefined>;
}