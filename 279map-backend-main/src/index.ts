import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { APIDefine, Auth, MapKind } from '279map-common';
import { getItems } from './getItems';
import session from 'express-session';
import { configure, getLogger } from "log4js";
import { DbSetting, LogSetting, SessionSecretKey } from './config';
import { getThumbnail } from './getThumbnsil';
import { getContents } from './getContents';
import { getEvents } from './getEvents';
import Broadcaster from './session/Broadcaster';
import proxy from 'express-http-proxy';
import https from 'https';
import { convertBase64ToBinary } from './util/utility';
import { geocoder, getGeocoderFeature } from './api/geocoder';
import { getCategory } from './api/getCategory';
import { getSnsPreview } from './api/getSnsPreview';
import { CurrentMap } from './session/SessionInfo';
import { getOriginalIconDefine } from './api/getOriginalIconDefine';
import { getIcon } from './api/getIcon';
import { utility, api as backendAPI, types } from '279map-backend-common';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import { exit } from 'process';
import { getMapId } from './getMapDefine';
import { ConnectResult, GeocoderParam, GeocoderResult, GetCategoryAPI, GetContentsAPI, GetEventsAPI, GetGeocoderFeatureParam, GetGeoCoderFeatureResult, GetItemsAPI, GetItemsResult, GetMapInfoAPI, GetMapInfoResult, GetOriginalIconDefineAPI, GetSnsPreviewAPI, GetSnsPreviewParam, GetSnsPreviewResult, GetUnpointDataAPI, GetUnpointDataParam, GetUnpointDataResult, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from '../279map-api-interface/src';
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';
import { getMapUser } from './auth/getMapUser';
import { getMapPageInfo } from './getMapInfo';
import { getSessionIdFromCookies } from './session/session_utility';

declare global {
    namespace Express {
        interface Request {
            connect?: {
                sessionKey: string; // SID or Token
                mapId: string;
                mapPageInfo?: types.schema.MapPageInfoTable;
                authLv?: Auth;
            }
        }
    }
}

// ログ初期化
configure(LogSetting);
const logger = getLogger();
const apiLogger = getLogger('api');

// process.exitは非同期処理を待たないので、loggerではなくconsoleで出力
console.log('checking process.env');
// 必須環境変数が定義されているかチェック
if (!process.env.MAIN_SERVICE_PORT) {
    console.warn('not set env MAIN_SERVICE_PORT');
    exit(1);
}
if (!process.env.SESSION_SECRET_KEY) {
    console.warn('not set env SESSION_SECRET_KEY');
    exit(1);
}
if (!process.env.HOST) {
    console.warn('not set env HOST');
    exit(1);
}

logger.info('preparomg express');

const app = express();
const port = 443;

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

/** セッション設定 */
const sessionConfig = {
    secret: SessionSecretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'none' as boolean | "none" | "lax" | "strict" | undefined,
        secure: true,
    }
};
app.use(session(sessionConfig));
app.use(cookieParser());

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
            await utility.sleep(3);
        }
        
    } while(flag);
}

// let connectNum = 0;
// ConnectionPool.on('connection', () => {
//     logger.debug('connection', ++connectNum);
// });
// ConnectionPool.on('release', () => {
//     --connectNum;
//     if (connectNum < 0) {
//         connectNum = 0;
//     }
//     logger.debug('release', connectNum);
// });
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

// Create Web Server
const server = https.createServer({
    key: readFileSync(process.env.SSL_KEY_FILE || ''),
    cert: readFileSync(process.env.SSL_CERT_FILE || ''),
}, app);

// Create WebSoskce Server
const broadCaster = new Broadcaster(server);

const checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,

});

/**
 * mapIdを取得してrequestに格納
 */
app.all('/api/*', 
    async(req: Request, res: Response, next: NextFunction) => {
        let sessionKey = req.headers.authorization;
        if (!sessionKey) {
            sessionKey = getSessionIdFromCookies(req);
        }
        if (!sessionKey) {
            sessionKey = req.sessionID;
        }
        apiLogger.info('[start]', req.url, sessionKey);

        if (req.url.startsWith('/api/connect')) {
            const queryMapId = req.query.mapId;
            if (!queryMapId || typeof queryMapId !== 'string') {
                res.status(400).send('not set mapId');
                return;
            }
            const mapId = await getMapId(queryMapId);
            if (mapId === null) {
                res.status(400).send('mapId is not found : ' + queryMapId);
                return;
            }
            req.connect = {
                sessionKey,
                mapId,
            };
        } else {
            const session = broadCaster.getSessionInfo(sessionKey);
            if (!session?.currentMap) {
                res.status(400).send('currentMap is not found: ' + sessionKey);
                return;
            }
            req.connect = { 
                sessionKey,
                mapId: session.currentMap.mapPageId
            };
        }
        next();
    }
);

/**
 * 認証チェック。チェックの課程で、connect.mapPageInfo, authに値設定。
 */
app.all('/api/*', 
    async(req: Request, res: Response, next: NextFunction) => {
        if (!req.connect) {
            apiLogger.error('connect not found.');
            res.status(500).send('Illegal state error.');
            return;
        }
        apiLogger.info('authorization', req.connect);

        const mapId = req.connect.mapId;

        // 地図情報取得
        const mapPageInfo = await getMapPageInfo(mapId);
        if (!mapPageInfo) {
            res.status(400).send('map not found.');
            return;
        }
        req.connect.mapPageInfo = mapPageInfo;

        if (!req.headers.authorization) {
            // 未ログインの場合は、地図がpublicか確認
            if (mapPageInfo.public_range === types.schema.PublicRange.Private) {
                // privateの場合 -> error
                apiLogger.debug('not auth');
                next({
                    name: 'Unauthenticated',
                    message: 'this map is private, please login.',
                });
            } else {
                // publicの場合
                apiLogger.debug('skip checkJwt');
                next('route');
            }
        
        } else {
            // 認証情報ある場合は、後続の認証チェック処理
            next();
        }
    },
    checkJwt,
    (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.log('error catch', err);
        if (err.name === 'Unauthenticated') {
            res.status(401).send({
                error: {
                    name: err.name,
                    message: err.message
                }
            });
        } else if (err.name === 'Bad Request') {
            res.status(400).send({
                error: {
                    name: err.name,
                    message: err.message
                }
            });
        } else {
            res.status(403).send({
                error: {
                    name: err.name,
                    message: err.message
                }
            });
        }
    },
);

/**
 * check the user's auth Level.
 * set req.connect.authLv
 */
app.all('/api/*', 
    async(req: Request, res: Response, next: NextFunction) => {
        const mapId = req.connect?.mapId;
        const mapDefine = req.connect?.mapPageInfo;
        if (!req.connect || !mapId || !mapDefine) {
            res.status(500).send('Illegal state error');
            return;
        }

        if (!req.auth) {
            // 未ログイン（地図の公開範囲public）の場合は、View権限
            apiLogger.debug('未ログイン', mapDefine.public_range);
            req.connect.authLv = Auth.View;
            next();
            return;
        }

        apiLogger.debug('ログイン済み', req.auth);
        // ユーザの地図に対する権限を取得
        const userId = req.auth.payload.sub;
        if (!userId) {
            res.status(400).send('user id not found');
            return;
        }
        const mapUserInfo = await getMapUser(mapId, userId);
        apiLogger.debug('mapUserInfo', mapUserInfo);

        if (mapUserInfo && mapUserInfo.auth_lv !== Auth.None) {
            req.connect.authLv = mapUserInfo.auth_lv;
        } else {
            // ユーザが権限を持たない場合
            if (mapDefine.public_range === types.schema.PublicRange.Public) {
                // 地図がPublicの場合、View権限
                req.connect.authLv = Auth.View;
            } else {
                // 地図がprivateの場合、権限なしエラーを返却
                res.status(403).send('user has no authentication for the map.');
            }
        }
        next();

    }
);
/**
 * 接続確立
 */
app.get('/api/connect', async(req, res, next) => {
    apiLogger.info('[start] connect', req.connect?.sessionKey);
    apiLogger.info('cookie', req.cookies);
    if (!req.headers.cookie) {
        // Cookie未設定時は、セッションに適当な値を格納することで、Cookieを作成する
        // @ts-ignore
        req.session.temp = 'hogehoge';
    }

    try {
        if (!req.connect || !req.connect.mapPageInfo || !req.connect.authLv) {
            res.status(500).send('Illegal state error');
            return;
        }

        const result: ConnectResult = {
            mapId: req.connect.mapId,
            name: req.connect.mapPageInfo.title,
            useMaps: req.connect.mapPageInfo.use_maps.split(',').map(mapKindStr => {
                return mapKindStr as MapKind;
            }),
            defaultMapKind: req.connect.mapPageInfo.default_map,
            authLv: req.connect.authLv,
        }

        const session = broadCaster.addSession(req.connect.sessionKey);
        session.currentMap = {
            mapPageId: req.connect.mapId,
            mapKind: req.connect.mapPageInfo.default_map,
        };
    
        res.send(result);
        apiLogger.info('[end] connect', req.connect.sessionKey);
    
    } catch(e) {
        apiLogger.warn('connect error', e);
        res.status(500).send(e);

    }
});
/**
 * 切断
 */
app.get('/api/disconnect', async(req, res) => {
    if (!req.connect) {
        res.status(400).send('no session');
        return;
    }
    broadCaster.removeSession(req.connect.sessionKey);

    res.send('disconnect');
});

type APIFuncParam<PARAM> = {
    currentMap: CurrentMap | undefined;
    req: Request;
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
            const session = broadCaster.getSessionInfo(req.connect?.sessionKey as string);
            const myResult = result as GetMapInfoResult;
            console.log('get map Info after', session);
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
            const session = broadCaster.getSessionInfo(req.connect?.sessionKey as string);
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
            const id = await backendAPI.callOdbaApi(backendAPI.RegistItemAPI, {
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
            await backendAPI.callOdbaApi(backendAPI.UpdateItemAPI, param);
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
            await backendAPI.callOdbaApi(backendAPI.RemoveItemAPI, param);
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
            await backendAPI.callOdbaApi(backendAPI.RegistContentAPI, Object.assign({
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
            await backendAPI.callOdbaApi(backendAPI.UpdateContentAPI, Object.assign({
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
        
            const res = await backendAPI.callOdbaApi(backendAPI.GetUnpointDataAPI, {
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
            await backendAPI.callOdbaApi(backendAPI.LinkContentToItemAPI, param);
        },
    } as APICallDefine<LinkContentToItemParam, void>,

    // コンテンツ削除
    {
        define: RemoveContentAPI,
        func: async({ param }) => {
            // DBA呼び出し
            await backendAPI.callOdbaApi(backendAPI.RemoveContentAPI, param);
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
            return await backendAPI.callOdbaApi(backendAPI.GetImageUrlAPI, param);
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
            const session = broadCaster.getSessionInfo(req.connect?.sessionKey as string);
    
            const param = getParam(req);

            // // TODO: getmapinfoでは不要
            // if (!session.mapPageId || !session.mapKind) {
            //     throw 'セッション状態不正:' + session.mapPageId + ',' + session.mapKind;
            // }

            const result = await api.func({ currentMap: session?.currentMap, req, param });
    
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

/**
 * Frontend資源へプロキシ
 */
if (process.env.FRONTEND_SERVICE_HOST && process.env.FRONTEND_SERVICE_PORT) {
    const url = process.env.FRONTEND_SERVICE_HOST + ':' + process.env.FRONTEND_SERVICE_PORT;
    app.use('*', proxy(url, {
        proxyReqPathResolver: (req) => {
            return req.originalUrl;
        },
    }));    
}

logger.info('starting internal server');
/**
 * 内部向けサーバー
 */
internalApp.use(express.urlencoded({extended: true}));
internalApp.use(express.json({
    limit: '1mb',
})); 
internalApp.post('/api/broadcast', (req: Request, res: Response) => {
    const param = req.body as backendAPI.BroadcastItemParam;
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
logger.info('starting db');
initializeDb()
.then(() => {
    logger.info('starting main server');
    server.listen(port, () => {
        logger.info('start server', port);
    });
    internalApp.listen(process.env.MAIN_SERVICE_PORT, () => {
        logger.info('start internal server', process.env.MAIN_SERVICE_PORT);
    })
});
