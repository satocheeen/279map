import { Request, Response, Express } from 'express';
import { Logger } from "log4js";
import { OdbaGetImageUrlAPI, OdbaGetImageUrlParam, OdbaGetLinkableContentsAPI, OdbaGetLinkableContentsResult, OdbaGetUncachedDataAPI, OdbaLinkDataAPI, OdbaLinkDataParam, OdbaRegistDataAPI, OdbaRegistDataParam, OdbaRemoveDataAPI, OdbaRemoveDataParam, OdbaUnlinkDataAPI, OdbaUnlinkDataParam, OdbaUpdateDataAPI, OdbaUpdateDataParam } from "./dba-api-interface";
import OdbaInterface from "./OdbaInterface";
import { APIDefine, CurrentMap } from "../types";
import { DataId } from '../types-common/common-types';

type OdbaAPIFuncParam<PARAM> = {
    param: PARAM;
}
export type OdbaAPIFunc<PARAM, RESULT> = (param: OdbaAPIFuncParam<PARAM>) => Promise<RESULT>;

export type OdbaAPICallDefine<PARAM, RESULT> = {
    define: APIDefine<PARAM, RESULT>;
    func: OdbaAPIFunc<PARAM, RESULT>;
}

export function initializeOdba(app: Express, odba: OdbaInterface, logger: Logger) {
    const apiList: OdbaAPICallDefine<any,any>[] = [
        {
            define: OdbaRegistDataAPI,
            func: async(param: OdbaAPIFuncParam<OdbaRegistDataParam>): Promise<DataId> => {
                return await odba.registData(param.param);
            }
        },
        {
            define: OdbaUpdateDataAPI,
            func: async(param: OdbaAPIFuncParam<OdbaUpdateDataParam>): Promise<boolean> => {
                return await odba.updateData(param.param);
            }
        },
        {
            define: OdbaRemoveDataAPI,
            func: async(param: OdbaAPIFuncParam<OdbaRemoveDataParam>): Promise<boolean> => {
                return await odba.removeData(param.param);
            }
        },
        {
            define: OdbaUnlinkDataAPI,
            func: async(param: OdbaAPIFuncParam<OdbaUnlinkDataParam>): Promise<void> => {
                await odba.unlinkData({
                    currentMap: param.param.currentMap, 
                    parent: param.param.parent,
                    id: param.param.id,
                    fieldKey: param.param.fieldKey,
                })
            }
        },
        {
            define: OdbaGetUncachedDataAPI,
            func: odba.getUncachedData,
        },
        {
            define: OdbaLinkDataAPI,
            func: async(param: OdbaAPIFuncParam<OdbaLinkDataParam>): Promise<void> => {
                await odba.linkData(param.param);
            }
        },
        {
            define: OdbaGetImageUrlAPI,
            func: async(param: OdbaAPIFuncParam<OdbaGetImageUrlParam>): Promise<string|undefined> => {
                return await odba.getImageUrl(param.param);

            }
        },
        {
            define: OdbaGetLinkableContentsAPI,
            func: async(param: OdbaAPIFuncParam<{currentMap: CurrentMap}>): Promise<OdbaGetLinkableContentsResult> => {
                return await odba.getLinkableContents(param.param.currentMap);
            },
        },
    ];
    registAPIs(app, apiList, logger);
}

export function registAPIs(app: Express, apiList: OdbaAPICallDefine<any,any>[], logger: Logger) {
    apiList.forEach((api => {
        const getParam = (req: Request): typeof api.define.param => {
            if (api.define.method === 'post') {
                return req.body as typeof api.define.param;
            } else {
                return req.query as typeof api.define.param;
            }
        }
    
        const execute =  async(req: Request, res: Response) => {
            try {
                const param = getParam(req);
                logger.info('[start] ' + api.define.uri, param);
    
                const result = await api.func({ param });
        
                logger.info('[end] ' + api.define.uri);
                logger.debug('result', result);
            
                if (!result) {
                    // undefinedを返すと、main-serverが結果受信できないので。
                    res.send('complete');
                } else if (typeof result === 'number') {
                    // 文字列にしないと、statusCode扱いになってしまうので
                    res.send(result + '');
                } else {
                    res.send(result);
                }
    
            } catch(e) {    
                logger.warn(api.define.uri + ' error', e);
                res.status(500).send(e);
            }
        };
    
        if (api.define.method === 'post') {
            app.post('/' + api.define.uri, execute);
        } else {
            app.get('/' + api.define.uri, execute);
        }
    
    }));
}
