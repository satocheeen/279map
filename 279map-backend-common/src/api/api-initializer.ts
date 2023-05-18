import { APIDefine, DataId } from "279map-common";
import { Request, Response, Express } from 'express';
import { Logger } from "log4js";
import { GetImageUrlAPI, GetUnpointDataAPI, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from "./dba-api-interface";
import OdbaInterface from "./OdbaInterface";

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
            define: RegistItemAPI,
            func: async(param: OdbaAPIFuncParam<RegistItemParam>): Promise<DataId> => {
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
            define: RegistContentAPI,
            func: async(param: OdbaAPIFuncParam<RegistContentParam>): Promise<void> => {
                // regist to original db
                const contentId = await odba.registContentOdb(param.param);

                // update cache db
                await odba.updateContentCache({
                    currentMap: param.param.currentMap, 
                    contentId,
                });
            },
        },
        {
            define: RemoveItemAPI,
            func: async(param: OdbaAPIFuncParam<RemoveItemParam>): Promise<void> => {
                await odba.removeItemOdb(param.param);

                await odba.removeItemCache({
                    currentMap: param.param.currentMap, 
                    itemId: param.param.id,
                });
            },
        },
        {
            define: RemoveContentAPI,
            func: async(param: OdbaAPIFuncParam<RemoveContentParam>): Promise<void> => {

                if (param.param.mode === 'alldelete') {
                    await odba.removeContentOdb({
                        currentMap: param.param.currentMap, 
                        contentId: param.param.id,
                    });
                    await odba.removeContentCache({
                        currentMap: param.param.currentMap, 
                        contentId: param.param.id,
                    });

                } else if(param.param.parentContentId) {
                    // 子コンテンツを外す場合
                    await odba.unlinkContentOdb({
                        currentMap: param.param.currentMap, 
                        parent: {
                            contentId: param.param.parentContentId,
                        },
                        childContentId: param.param.id,
                    })
                    await odba.updateContentLinkCache({
                        currentMap: param.param.currentMap, 
                        parent: {
                            contentId: param.param.parentContentId,
                        },
                        contentId: param.param.id,
                    });
                } else {
                    // アイテムとの接続を切った場合
                    await odba.unlinkContentOdb({
                        currentMap: param.param.currentMap, 
                        parent: {
                            itemId: param.param.itemId,
                        },
                        childContentId: param.param.id,
                    })
                    await odba.updateContentLinkCache({
                        currentMap: param.param.currentMap, 
                        parent: {
                            itemId: param.param.itemId,
                        },
                        contentId: param.param.id,
                    });
                }
            }
        },
        {
            define: UpdateItemAPI,
            func: async(param: OdbaAPIFuncParam<UpdateItemParam>): Promise<void> => {
                await odba.updateItemOdb(param.param);

                // update cache db
                await odba.updateItemCache({
                    currentMap: param.param.currentMap, 
                    itemId: param.param.id,
                });
            },
        },
        {
            define: UpdateContentAPI,
            func: async(param: OdbaAPIFuncParam<UpdateContentParam>): Promise<void> => {
                await odba.updateContentOdb(param.param);

                await odba.updateContentCache({
                    currentMap: param.param.currentMap, 
                    contentId: param.param.id,
                });
            },
        },
        {
            define: GetUnpointDataAPI,
            func: odba.getUnpointData,
        },
        {
            define: LinkContentToItemAPI,
            func: async(param: OdbaAPIFuncParam<LinkContentToItemParam>): Promise<void> => {
                await odba.linkContentOdb(param.param);

                await odba.updateContentLinkCache({
                    currentMap: param.param.currentMap, 
                    parent: param.param.parent,
                    contentId: param.param.childContentId,
                })
            }
        },
        {
            define: GetImageUrlAPI,
            func: odba.getImageUrl,
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
