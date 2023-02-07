import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { APIDefine, Auth } from '279map-common';
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
import { getMapDefine } from './getMapDefine';
import { ConnectResult, GeocoderParam, GeocoderResult, GetCategoryAPI, GetContentsAPI, GetEventsAPI, GetGeocoderFeatureParam, GetGeoCoderFeatureResult, GetItemsAPI, GetItemsResult, GetMapInfoAPI, GetMapInfoResult, GetOriginalIconDefineAPI, GetSnsPreviewAPI, GetSnsPreviewParam, GetSnsPreviewResult, GetUnpointDataAPI, GetUnpointDataParam, GetUnpointDataResult, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from '../279map-api-interface/src';
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';
import { getMapUser } from './auth/getMapUser';

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
 * 認証チェック
 */
app.get('/api/*', 
    async(req: Request, res: Response, next: NextFunction) => {
        apiLogger.info('authorization', req.headers.authorization);

        const mapId = req.query.mapId;
        if (!mapId || typeof mapId !== 'string') {
            throw 'not set mapId'
        }
        const auth = req.query.auth;
        if (auth && typeof auth !== 'string') {
            throw 'illegal auth';
        }

        if (!req.headers.authorization) {
            // 未ログインの場合は、地図がpublicか確認
            const define = await getMapDefine(mapId, auth);
        
            if (define.publicRange === types.schema.PublicRange.Private) {
                // privateの場合 -> error
                apiLogger.debug('not auth');
                next({
                    name: 'Unauthenticated',
                    message: 'this map is private, please login.',
                });
            } else {
                // publicの場合 -> View権限をresに付与？
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
        } else {
            res.status(403).send({
                error: {
                    name: err.name,
                    message: err.message
                }
            });
        }
    }
);

/**
 * 接続確立
 */
app.get('/api/connect', async(req, res, next) => {
    console.log('debug')
    apiLogger.info('[start] connect', req.sessionID);
    apiLogger.info('cookie', req.cookies);
    apiLogger.info('auth', req.auth);
    apiLogger.info('authorization', req.headers.authorization);
    if (!req.headers.cookie) {
        // Cookie未設定時は、セッションに適当な値を格納することで、Cookieを作成する
        // @ts-ignore
        req.session.temp = 'hogehoge';
    }

    try {
        const mapId = req.query.mapId;
        if (!mapId || typeof mapId !== 'string') {
            throw 'not set mapId'
        }
        const auth = req.query.auth;
        if (auth && typeof auth !== 'string') {
            throw 'illegal auth';
        }
        const token = req.query.token;
        if (token && typeof token !== 'string') {
            throw 'illegal token';
        }

        const mapDefine = await getMapDefine(mapId, auth);

        let result: ConnectResult;
        if (!req.auth) {
            // 未ログイン（地図の公開範囲public）の場合は、View権限
            apiLogger.debug('未ログイン', mapDefine.publicRange);
            result = {
                mapId: mapDefine.mapId,
                name: mapDefine.name,
                useMaps: mapDefine.useMaps,
                defaultMapKind: mapDefine.defaultMapKind,
                authLv: Auth.View,
            }
        } else {
            apiLogger.debug('ログイン済み', req.auth);
            // ユーザの地図に対する権限を取得
            const userId = req.auth.payload.sub;
            if (!userId) {
                throw 'user id not found';
            }
            const mapUserInfo = await getMapUser(mapDefine.mapId, userId);
            apiLogger.debug('mapUserInfo', mapUserInfo);
            let authLv: Auth;
            if (mapUserInfo && mapUserInfo.auth_lv !== Auth.None) {
                authLv = mapUserInfo.auth_lv;
            } else {
                // ユーザが権限を持たない場合
                if (mapDefine.publicRange === types.schema.PublicRange.Public) {
                    // 地図がPublicの場合、View権限
                    authLv = Auth.View;
                } else {
                    // 地図がprivateの場合、権限なしエラーを返却
                    res.status(403).send({
                        error: {
                            name: 'Forbidden',
                            message: 'user has no authentication for the map.',
                        }
                    });
                    return;
                }
            }
            result = {
                mapId: mapDefine.mapId,
                name: mapDefine.name,
                useMaps: mapDefine.useMaps,
                defaultMapKind: mapDefine.defaultMapKind,
                authLv,
            }
        }

        // // 認証Lv.取得
        // const authLv = await callAuthApi(auth);
        // console.log('authLv', authLv);

        // if (authLv) {
        //     define.authLv = authLv;
        // }
    
        // if (result.result === 'success') {
            broadCaster.addSession(req.sessionID);
        // }
    
        res.send(result);
        apiLogger.info('[end] connect', req.sessionID);
    
    } catch(e) {
        apiLogger.warn('connect error', e);
        res.status(500).send(e);

    }
});
/**
 * 切断
 */
app.get('/api/disconnect', async(req, res) => {
    console.log('disconnect', req.sessionID);

    broadCaster.removeSession(req.sessionID);

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
            let session = broadCaster.getSessionInfo(req.sessionID);
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
            const session = broadCaster.getSessionInfo(req.sessionID);
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
            const session = broadCaster.getSessionInfo(req.sessionID);
            const sid = req.cookies['connect.sid'];
    
            const param = getParam(req);
            apiLogger.info('[start] ' + api.define.uri, param, sid, session);

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
