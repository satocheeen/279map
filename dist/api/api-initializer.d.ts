import { api } from "279map-common";
import { Request, Response, Express } from 'express';
import { Logger } from "log4js";
import OdbaInterface from "./OdbaInterface";
declare type OdbaAPIFuncParam<PARAM> = {
    param: PARAM;
};
export declare type OdbaAPIFunc<PARAM, RESULT> = (param: OdbaAPIFuncParam<PARAM>) => Promise<RESULT>;
declare type AfterParam<PARAM, RESULT> = {
    param: PARAM;
    result: RESULT;
    req: Request;
    res: Response;
};
export declare type OdbaAPICallDefine<PARAM, RESULT> = {
    define: api.APIDefine<PARAM, RESULT>;
    func: (param: OdbaAPIFuncParam<PARAM>) => Promise<RESULT>;
    after?: (param: AfterParam<PARAM, RESULT>) => boolean;
};
export declare function initializeOdba(app: Express, odba: OdbaInterface, logger: Logger): void;
export declare function registAPIs(app: Express, apiList: OdbaAPICallDefine<any, any>[], logger: Logger): void;
export {};
