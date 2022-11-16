import { APIDefine } from "279map-common/dist/api";
import { Request, Response, Express } from 'express';
import { Logger } from "log4js";
import { GetImageUrlAPI, GetUnpointDataAPI, LinkContentToItemAPI, RegistContentAPI, RegistItemAPI, RemoveContentAPI, RemoveItemAPI, UpdateContentAPI, UpdateItemAPI } from "./dba-api-interface";
import OdbaInterface from "./OdbaInterface";

type OdbaAPIFuncParam<PARAM> = {
    param: PARAM;
}
export type OdbaAPIFunc<PARAM, RESULT> = (param: OdbaAPIFuncParam<PARAM>) => Promise<RESULT>;

type AfterParam<PARAM, RESULT> = {
    param: PARAM;
    result: RESULT;
    req: Request;
    res: Response;
}
export type OdbaAPICallDefine<PARAM, RESULT> = {
    define: APIDefine<PARAM, RESULT>;
    func: (param: OdbaAPIFuncParam<PARAM>) => Promise<RESULT>;
    // func実行後に実施する処理
    after?: (param: AfterParam<PARAM, RESULT>) => boolean;   // falseで復帰した場合は、res.sendしない
}

export function initializeOdba(app: Express, odba: OdbaInterface, logger: Logger) {
    const apiList: OdbaAPICallDefine<any,any>[] = [
        {
            define: RegistItemAPI,
            func: odba.registItem,
        },
        {
            define: RegistContentAPI,
            func: odba.registContent,
        },
        {
            define: RemoveItemAPI,
            func: odba.removeItem,
        },
        {
            define: RemoveContentAPI,
            func: odba.removeContent,
        },
        {
            define: UpdateItemAPI,
            func: odba.updateItem,
        },
        {
            define: UpdateContentAPI,
            func: odba.updateContent,
        },
        {
            define: GetUnpointDataAPI,
            func: odba.getUnpointData,
        },
        {
            define: LinkContentToItemAPI,
            func: odba.linkContentToItem,
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
                console.log('req body', req.body);
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
        
                let doSend = true;
                if (api.after) {
                    doSend = api.after({ param, result, req, res });
                }
            
                logger.info('[end] ' + api.define.uri);
                logger.debug('result', result);
            
                if (doSend) {
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
