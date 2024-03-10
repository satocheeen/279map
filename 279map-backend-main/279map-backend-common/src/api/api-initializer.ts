import { Request, Response, Express } from 'express';
import { Logger } from "log4js";
import { OdbaGetImageUrlAPI, OdbaGetLinkableContentsAPI, OdbaGetLinkableContentsResult, OdbaGetUnpointDataAPI, OdbaLinkContentDatasourceToMapAPI, OdbaLinkContentDatasourceToMapParam, OdbaLinkContentToItemAPI, OdbaLinkContentToItemParam, OdbaRegistContentAPI, OdbaRegistContentParam, OdbaRegistItemAPI, OdbaRegistItemParam, OdbaRemoveContentAPI, OdbaRemoveContentParam, OdbaRemoveItemAPI, OdbaRemoveItemParam, OdbaUnlinkContentAPI, OdbaUnlinkContentDatasourceFromMapAPI, OdbaUnlinkContentDatasourceFromMapParam, OdbaUnlinkContentParam, OdbaUpdateContentAPI, OdbaUpdateContentParam, OdbaUpdateItemAPI, OdbaUpdateItemParam } from "./dba-api-interface";
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
            define: OdbaRegistItemAPI,
            func: async(param: OdbaAPIFuncParam<OdbaRegistItemParam>): Promise<DataId> => {
                // regist to original db
                const itemId = await odba.registItemOdb(param.param);

                // update cache db
                await odba.updateItemCache({
                    currentMap: param.param.currentMap, 
                    itemId,
                });
                return itemId;
            }
        },
        {
            define: OdbaRegistContentAPI,
            func: async(param: OdbaAPIFuncParam<OdbaRegistContentParam>): Promise<void> => {
                // regist to original db
                await odba.registContent(param.param);
            },
        },
        {
            define: OdbaRemoveItemAPI,
            func: async(param: OdbaAPIFuncParam<OdbaRemoveItemParam>): Promise<void> => {
                await odba.removeItemOdb(param.param);

                await odba.removeItemCache({
                    currentMap: param.param.currentMap, 
                    itemId: param.param.id,
                });
            },
        },
        {
            define: OdbaRemoveContentAPI,
            func: async(param: OdbaAPIFuncParam<OdbaRemoveContentParam>): Promise<void> => {
                await odba.removeContentOdb({
                    currentMap: param.param.currentMap, 
                    contentId: param.param.id,
                });
                await odba.removeContentCache({
                    currentMap: param.param.currentMap, 
                    contentId: param.param.id,
                });
            }
        },
        {
            define: OdbaUnlinkContentAPI,
            func: async(param: OdbaAPIFuncParam<OdbaUnlinkContentParam>): Promise<void> => {
                if (param.param.parent.type === 'content') {
                    // 子コンテンツとの接続を切る場合
                    await odba.unlinkContent({
                        currentMap: param.param.currentMap, 
                        parent: {
                            contentId: param.param.parent.contentId,
                        },
                        childContentId: param.param.id,
                    })

                } else {
                    // アイテムとの接続を切った場合
                    await odba.unlinkContent({
                        currentMap: param.param.currentMap, 
                        parent: {
                            itemId: param.param.parent.itemId,
                        },
                        childContentId: param.param.id,
                    })
                }
            }
        },
        {
            define: OdbaUpdateItemAPI,
            func: async(param: OdbaAPIFuncParam<OdbaUpdateItemParam>): Promise<void> => {
                await odba.updateItemOdb(param.param);

                // update cache db
                await odba.updateItemCache({
                    currentMap: param.param.currentMap, 
                    itemId: param.param.id,
                });
            },
        },
        {
            define: OdbaUpdateContentAPI,
            func: async(param: OdbaAPIFuncParam<OdbaUpdateContentParam>): Promise<void> => {
                await odba.updateContent(param.param);

            },
        },
        {
            define: OdbaGetUnpointDataAPI,
            func: odba.getUnpointData,
        },
        {
            define: OdbaLinkContentToItemAPI,
            func: async(param: OdbaAPIFuncParam<OdbaLinkContentToItemParam>): Promise<void> => {
                await odba.linkContent(param.param);
            }
        },
        {
            define: OdbaGetImageUrlAPI,
            func: odba.getImageUrl,
        },
        {
            define: OdbaGetLinkableContentsAPI,
            func: async(param: OdbaAPIFuncParam<{currentMap: CurrentMap}>): Promise<OdbaGetLinkableContentsResult> => {
                return await odba.getLinkableContents(param.param.currentMap);
            },
        },
        {
            define: OdbaLinkContentDatasourceToMapAPI,
            func: async(param: OdbaAPIFuncParam<OdbaLinkContentDatasourceToMapParam>): Promise<void> => {
                return await odba.linkContentDatasourceToMap(param.param);
            },
        },
        {
            define: OdbaUnlinkContentDatasourceFromMapAPI,
            func: async(param: OdbaAPIFuncParam<OdbaUnlinkContentDatasourceFromMapParam>): Promise<void> => {
                return await odba.unlinkContentDatasourceFromMap(param.param);
            },
        }
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
