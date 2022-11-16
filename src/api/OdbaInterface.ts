import { OdbaAPIFunc } from "./api-initializer";
import { GetUnpointDataParam, GetUnpointDataResult, LinkContentToItemParam, RegistContentParam, RegistItemParam, RemoveContentParam, RemoveItemParam, UpdateContentParam, UpdateItemParam } from "./dba-api-interface";

export default abstract class OdbaInterface {
    abstract registItem: OdbaAPIFunc<RegistItemParam, string>;

    abstract registContent: OdbaAPIFunc<RegistContentParam, void>;

    abstract removeItem: OdbaAPIFunc<RemoveItemParam, void>;

    abstract removeContent: OdbaAPIFunc<RemoveContentParam, void>;

    abstract updateItem: OdbaAPIFunc<UpdateItemParam, void>;

    abstract updateContent: OdbaAPIFunc<UpdateContentParam, void>;

    abstract getUnpointData: OdbaAPIFunc<GetUnpointDataParam, GetUnpointDataResult>;

    abstract linkContentToItem: OdbaAPIFunc<LinkContentToItemParam, void>;

    abstract getImageUrl: OdbaAPIFunc<{id: string}, string | undefined>;
}