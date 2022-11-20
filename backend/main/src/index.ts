import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { GeocoderParam, GetGeocoderFeatureParam, GetGeoCoderFeatureResult, APIDefine, GetItemsAPI, GetContentsAPI, GetCategoryAPI, GetEventsAPI, RegistItemAPI, UpdateItemAPI, RemoveItemAPI, RegistContentAPI, UpdateContentAPI, GetUnpointDataAPI, LinkContentToItemAPI, GetSnsPreviewAPI, GetMapInfoAPI, GeocoderResult, RemoveContentAPI, GetItemsResult, GetMapInfoResult, GetOriginalIconDefineAPI, RegistItemParam, UpdateItemParam, RemoveItemParam, RegistContentParam, UpdateContentParam, GetUnpointDataParam, GetUnpointDataResult, LinkContentToItemParam, RemoveContentParam, GetSnsPreviewParam, GetSnsPreviewResult } from '279map-common/dist/api';
import { getItems } from './getItems';
import session from 'express-session';
import { configure, getLogger } from "log4js";
import { DbSetting, LogSetting, SessionSecretKey } from './config';
import { getThumbnail } from './getThumbnsil';
import { getContents } from './getContents';
import { getEvents } from './getEvents';
import Broadcaster from './session/Broadcaster';
import proxy from 'express-http-proxy';
import http from 'http';
import { convertBase64ToBinary } from './util/utility';
import { geocoder, getGeocoderFeature } from './api/geocoder';
import { getCategory } from './api/getCategory';
import { getSnsPreview } from './api/getSnsPreview';
import { CurrentMap } from './session/SessionInfo';
import { getOriginalIconDefine } from './api/getOriginalIconDefine';
import { getIcon } from './api/getIcon';
import { sleep } from '279map-backend-common/dist/utility';
import { callOdbaApi } from '279map-backend-common/dist/api/client';
import * as ODBA from "279map-backend-common/dist/api/dba-api-interface";
import { BroadcastItemParam } from '279map-backend-common/dist/api/broadcast';
import cors from 'cors';

// ログ初期化
configure(LogSetting);
const logger = getLogger();
const apiLogger = getLogger('api');

const app = express();
const port = 80;

const internalApp = express();

const allowCorsOrigin = process.env.CORS_ALLOW_ORIGIN || '';
logger.info('allowCors', allowCorsOrigin);
if (allowCorsOrigin.length > 0) {
    const origin = allowCorsOrigin.split(',');
    app.use(cors({
        origin,
        credentials: true,
    }));
}
/**
 * Android用APIのプロキシ
 */
app.use('/android', proxy(process.env.ODBA_SERVICE_HOST + ':' + process.env.ODBA_SERVICE_PORT));
 
app.use(express.urlencoded({extended: true}));
app.use(express.json({
    limit: '1mb',
})); 
app.use(session({
    secret: SessionSecretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'none',
    }
}));

// 本番では./html、開発環境では../buildを参照する
const static_path = process.env.STATIC_PATH || '../../build';
app.use(express.static(static_path));

// File Service proxy
if (process.env.FS_SERVICE_URL_PATH) {
    logger.info('setup FileService', process.env.FS_SERVICE_URL_PATH);
    app.use(process.env.FS_SERVICE_URL_PATH, proxy(process.env.FS_SERVICE_HOST + ':' + process.env.FS_SERVICE_PORT, {
        proxyReqPathResolver(req) {
            let newPath = '/get' + req.path;
            if (newPath.endsWith('/')) {
                newPath = newPath.substring(0, newPath.length - 1);
            }
            return newPath;
        },
    }));
}

// DBコネクションプーリング
logger.debug('DbSetting', DbSetting);
export const ConnectionPool = mysql.createPool(DbSetting);

const initializeDb = async() => {
    // DB接続失敗したらリトライする
    let flag = true;
    do {
        try {
            await ConnectionPool.getConnection()
            flag = false;
        } catch (e) {
            logger.warn('db cconnect failed. retry...');
            await sleep(3);
        }
        
    } while(flag);
}

let connectNum = 0;
ConnectionPool.on('connection', () => {
    logger.debug('connection', ++connectNum);
});
ConnectionPool.on('release', () => {
    --connectNum;
    if (connectNum < 0) {
        connectNum = 0;
    }
    logger.debug('release', connectNum);
});
// let querNum = 0;
// ConnectionPool.on('acquire', () => {
//     logger.debug('acquire', ++querNum);
// });
// ConnectionPool.on('enqueue', () => {
//     --querNum;
//     if (querNum < 0) {
//         querNum = 0;
//     }
//     logger.debug('enqueue', querNum);
// })

// WebSoskcet準備
const server = http.createServer(app);
const broadCaster = new Broadcaster(server);

/**
 * 接続確立
 */
app.get('/api/connect', async(req, res) => {
    logger.info('connect', req.sessionID);
    // セッションに何か格納しておかないとsessionIDが変わってしまうので、
    // 適当な値を設定
    // @ts-ignore
    req.session.temp = 'hogehoge';

    broadCaster.addSession(req);

    res.send('connect');
});
/**
 * 切断
 */
app.get('/api/disconnect', async(req, res) => {
    console.log('disconnect', req.sessionID);

    broadCaster.removeSession(req);

    res.send('disconnect');
});

type APIFuncParam<PARAM> = {
    currentMap: CurrentMap | undefined;
    param: PARAM;
}
export type APIFunc<PARAM, RESULT> = (param: APIFuncParam<PARAM>) => Promise<RESULT>;

type AfterParam<PARAM, RESULT> = {
    param: PARAM;
    result: RESULT;
    req: Request;
    res: Response;
}
type APICallDefine<PARAM, RESULT> = {
    define: APIDefine<PARAM, RESULT>;
    func: (param: APIFuncParam<PARAM>) => Promise<RESULT>;
    // func実行後に実施する処理
    after?: (param: AfterParam<PARAM, RESULT>) => boolean;   // falseで復帰した場合は、res.sendしない
}

const apiList: APICallDefine<any,any>[] = [
    // 地図基本情報取得
    {
        define: GetMapInfoAPI,
        func: getMapInfo,
        after: ({req, result }) => {
            let session = broadCaster.getSessionInfo(req);
            const myResult = result as GetMapInfoResult;
            if (!session) {
                logger.warn('no session');
            }
            if (session) {
                session.resetItems();
                session.currentMap = {
                    mapPageId: myResult.mapId,
                    mapKind: myResult.mapKind,
                }
            }

            return true;
        }
    },
    // オリジナルアイコン情報取得
    {
        define: GetOriginalIconDefineAPI,
        func: getOriginalIconDefine,
    },
    // 地図アイテム取得
    {
        define: GetItemsAPI,
        func: getItems,
        after: ({ req, result }) => {
            // 送信済みのコンテンツ情報は除外する
            // TODO: 削除考慮
            const session = broadCaster.getSessionInfo(req);
            if (!session) {
                logger.warn('no session');
                return true;
            }
            result.items = (result as GetItemsResult).items.filter(item => {
                const isSend = session.isSendedItem(item);
                return !isSend;
            });
            session.addItems(result.items);

            return true;
        }
    },
    // コンテンツ取得
    {
        define: GetContentsAPI,
        func: getContents,
    },
    // カテゴリ取得
    {
        define: GetCategoryAPI,
        func: getCategory,
    },
    // イベント取得
    {
        define: GetEventsAPI,
        func: getEvents,
    },

    // 位置アイテム登録
    {
        define: RegistItemAPI,
        func: async({ currentMap, param }) => {
            if (!currentMap) {
                throw 'no currentmap';
            }
            const mapPageId = currentMap.mapPageId;
            const mapKind = currentMap.mapKind;
        
            // DBA呼び出し
            const id = await callOdbaApi(ODBA.RegistItemAPI, {
                mapId: mapPageId,
                mapKind,
                geometry: param.geometry,
                geoProperties: param.geoProperties,
            });
        
            return id;
        },
        after: ({ req }) => {
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
            return true;
        },
    } as APICallDefine<RegistItemParam, string>,

    // 位置アイテム更新
    {
        define: UpdateItemAPI,
        func: async({ param }) => {
            await callOdbaApi(ODBA.UpdateItemAPI, param);
        },
        after: ({ req }) => {
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
            return true;
        }
    } as APICallDefine<UpdateItemParam, void>,

    // 位置アイテム削除
    {
        define: RemoveItemAPI,
        func: async({ param }) => {
            await callOdbaApi(ODBA.RemoveItemAPI, param);
        },
        after: ( { req, param }) => {
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'delete',
                itemPageIdList: [param.id],
            });
            return true;
        }
    } as APICallDefine<RemoveItemParam, void>,

    // コンテンツ登録
    {
        define: RegistContentAPI,
        func: async({ currentMap: currentMap, param }) => {
            if (!currentMap) {
                throw 'no currentmap';
            }
            const mapPageId =currentMap.mapPageId;
            
            // DBA呼び出し
            await callOdbaApi(ODBA.RegistContentAPI, Object.assign({
                mapId: mapPageId,
            }, param));
        },
        after: ({ req }) => {
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
            return true;
        }
    } as APICallDefine<RegistContentParam, void>,

    // コンテンツ更新
    {
        define: UpdateContentAPI,
        func: async({ currentMap, param }) => {
            if (!currentMap) {
                throw 'no currentmap';
            }
            const mapId = currentMap.mapPageId;
            
            // DBA呼び出し
            await callOdbaApi(ODBA.UpdateContentAPI, Object.assign({
                mapId,
            }, param));
        },
        after: ({ req }) => {
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
            return true;
        }
    } as APICallDefine<UpdateContentParam, void>,

    // 地点未登録コンテンツ取得
    {
        define: GetUnpointDataAPI,
        func: async({ currentMap, param }) => {
            if (!currentMap) {
                throw 'no currentmap';
            }
        
            const res = await callOdbaApi(ODBA.GetUnpointDataAPI, {
                mapId: currentMap.mapPageId,
                mapKind: currentMap.mapKind,
                nextToken: param.nextToken,
            });
        
            return res;
        },
    } as APICallDefine<GetUnpointDataParam, GetUnpointDataResult>,

    // コンテンツをアイテムに紐づけ
    {
        define: LinkContentToItemAPI,
        func: async({ param }) => {
            // DBA呼び出し
            await callOdbaApi(ODBA.LinkContentToItemAPI, param);
        },
    } as APICallDefine<LinkContentToItemParam, void>,

    // コンテンツ削除
    {
        define: RemoveContentAPI,
        func: async({ param }) => {
            // DBA呼び出し
            await callOdbaApi(ODBA.RemoveContentAPI, param);
        },
    } as APICallDefine<RemoveContentParam, void>,

    // SNSプレビュー取得
    {
        define: GetSnsPreviewAPI,
        func: getSnsPreview,
    } as APICallDefine<GetSnsPreviewParam, GetSnsPreviewResult>,

    // サムネイル画像取得
    {
        define: {
            uri: 'getthumb',
            method: 'get',
        },
        func: getThumbnail,
        after: ({ res, result }) => {
            const bin = convertBase64ToBinary(result);
            res.writeHead(200, {
                'Content-Type': bin.contentType,
                'Content-Length': bin.binary.length
            });
            res.end(bin.binary);

            return false;
        },
    } as APICallDefine<{id: string}, string>,

    // オリジナル画像URL取得
    {
        define: {
            uri: 'getimageurl',
            method: 'get',
        } as APIDefine<{id: string}, string>,
        func: async({ param }) => {
            // DBA呼び出し
            return await callOdbaApi(ODBA.GetImageUrlAPI, param);
        },
    } as APICallDefine<{id: string}, string>,

    // アイコン画像取得
    {
        define: {
            uri: 'geticon',
            method: 'get',
        },
        func: getIcon,
        after: ({ res, result }) => {
            const bin = convertBase64ToBinary(result);
            res.writeHead(200, {
                'Content-Type': bin.contentType,
                'Content-Length': bin.binary.length
            });
            res.end(bin.binary);

            return false;
        },
    } as APICallDefine<{id: string}, string>,

    // 住所検索
    {
        define: {
            uri: 'geocoder',
            method: 'get',
        },
        func: geocoder,
    } as APICallDefine<GeocoderParam, GeocoderResult>,

    // 住所検索結果Feature取得
    {
        define: {
            uri: 'getGeocoderFeature',
            method: 'get',
        },
        func: getGeocoderFeature,
    } as APICallDefine<GetGeocoderFeatureParam, GetGeoCoderFeatureResult>,
];

apiList.forEach((api => {
    const getParam = (req: Request) => {
        if (api.define.method === 'post') {
            return req.body;
        } else {
            return req.query;
        }
    }

    const execute =  async(req: Request, res: Response) => {
        try {
            const session = broadCaster.getSessionInfo(req);
    
            const param = getParam(req);
            apiLogger.info('[start] ' + api.define.uri, param, req.sessionID, session !== undefined);

            // // TODO: getmapinfoでは不要
            // if (!session.mapPageId || !session.mapKind) {
            //     throw 'セッション状態不正:' + session.mapPageId + ',' + session.mapKind;
            // }

            const result = await api.func({ currentMap: session?.currentMap, param });
    
            let doSend = true;
            if (api.after) {
                doSend = api.after({ param, result, req, res });
            }
        
            apiLogger.info('[end] ' + api.define.uri);
            apiLogger.debug('result', result);
        
            if (doSend) {
                res.send(result);
            }

        } catch(e) {    
            apiLogger.warn(api.define.uri + ' error', e);
            res.status(500).send(e);
        }
    };

    if (api.define.method === 'post') {
        app.post('/api/' + api.define.uri, execute);
    } else {
        app.get('/api/' + api.define.uri, execute);
    }

}));

app.use('*', express.static(static_path));

/**
 * 内部向けサーバー
 */
internalApp.use(express.urlencoded({extended: true}));
internalApp.use(express.json({
    limit: '1mb',
})); 
internalApp.post('/api/broadcast', (req: Request, res: Response) => {
    const param = req.body as BroadcastItemParam;
    logger.info('broadcast', param);
    switch(param.operation) {
        case 'insert':
            broadCaster.broadCastAddItem(param.mapId, param.itemIdList);
            break;
        case 'update':
            broadCaster.broadCastUpdateItem(param.mapId, param.itemIdList);
            break;
        case 'delete':
            broadCaster.broadCastDeleteItem(param.mapId, param.itemIdList);
            break;
    }
	res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(201).send('broadcasted.');
});

// DB接続完了してから開始
initializeDb()
.then(() => {
    server.listen(port, () => {
        logger.info('start server', port);
    });
    internalApp.listen(process.env.MAIN_SERVICE_PORT, () => {
        logger.info('start internal server', process.env.MAIN_SERVICE_PORT);
    })
});
