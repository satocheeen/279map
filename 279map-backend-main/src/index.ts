import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { Auth, MapKind, MapDefine } from '279map-common';
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
import SessionInfo, { CurrentMap } from './session/SessionInfo';
import { getOriginalIconDefine } from './api/getOriginalIconDefine';
import { getIcon } from './api/getIcon';
import { utility, api as backendAPI, types } from '279map-backend-common';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import { exit } from 'process';
import { getMapId } from './getMapDefine';
import { GeocoderParam, GetCategoryAPI, GetContentsAPI, GetContentsParam, GetEventsAPI, GetGeocoderFeatureParam, GetItemsAPI, GetItemsResult, GetMapInfoAPI, GetMapInfoParam, GetOriginalIconDefineAPI, GetSnsPreviewAPI, GetSnsPreviewParam, GetUnpointDataAPI, GetUnpointDataParam, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from '../279map-api-interface/src';
import { auth } from 'express-oauth2-jwt-bearer';
import { getMapUser } from './auth/getMapUser';
import { getMapPageInfo } from './getMapInfo';
import { getSessionIdFromCookies } from './session/session_utility';
import { GetItemsParam } from '../279map-api-interface/dist';

declare global {
    namespace Express {
        interface Request {
            connect?: {
                sessionKey: string; // SID or Token
                mapId: string;
                mapPageInfo?: types.schema.MapPageInfoTable;
                authLv?: Auth;
                userName?: string;
            },
            currentMap: CurrentMap;
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
                apiLogger.warn('currentMap is not found: ', sessionKey, broadCaster._sessionMap);
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
 * Authorization.
 * set connect.mapPageInfo, auth in this process.
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
            req.connect.userName = mapUserInfo.name;
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

        const result: MapDefine = {
            mapId: req.connect.mapId,
            name: req.connect.mapPageInfo.title,
            useMaps: req.connect.mapPageInfo.use_maps.split(',').map(mapKindStr => {
                return mapKindStr as MapKind;
            }),
            defaultMapKind: req.connect.mapPageInfo.default_map,
            authLv: req.connect.authLv,
            userName: req.connect.userName || '',
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

const checkApiAuthLv = (needAuthLv: Auth) => {
    return async(req: Request, res: Response, next: NextFunction) => {
        let allowAuthList: Auth[];
        switch(needAuthLv) {
            case Auth.View:
                allowAuthList = [Auth.View, Auth.Edit];
                break;
            case Auth.Edit:
                allowAuthList = [Auth.Edit];
                break;
            default:
                allowAuthList = [];
        }
        if (!req.connect?.authLv || !allowAuthList.includes(req.connect.authLv)) {
            res.status(403).send('the user does not have authentication using this api.');
            return;
        }
        next();
    }
}

// 地図基本情報取得
app.post(`/api/${GetMapInfoAPI.uri}`, 
    checkApiAuthLv(Auth.View), 
    async(req, res) => {
        try {
            const session = broadCaster.getSessionInfo(req.connect?.sessionKey as string);

            const param = req.body as GetMapInfoParam;

            const result = await getMapInfo(param);

            session.resetItems();
            session.currentMap = {
                mapPageId: result.mapId,
                mapKind: result.mapKind,
            }

            apiLogger.debug('result', result);

            res.send(result);

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * check whether connecting map and set the value of req.currentMap
 */
const checkCurrentMap = async(req: Request, res: Response, next: NextFunction) => {
    const session = broadCaster.getSessionInfo(req.connect?.sessionKey as string);
    if (!session.currentMap) {
        res.status(500).send('not connect a map');
        return;
    }
    req.currentMap = session.currentMap;
    next();
}


/**
 * get original icon define
 * オリジナルアイコン情報取得
 */
app.post(`/api/${GetOriginalIconDefineAPI.uri}`, 
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const result = await getOriginalIconDefine(req.currentMap);

            apiLogger.debug('result', result);

            res.send(result);

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * get items
 * 地図アイテム取得
 */
app.post(`/api/${GetItemsAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as GetItemsParam;
            const result = await getItems({
                param,
                currentMap: req.currentMap
            });

            // 送信済みのコンテンツ情報は除外する
            // TODO: 削除考慮
            const session = broadCaster.getSessionInfo(req.connect?.sessionKey as string) as SessionInfo;
            result.items = (result as GetItemsResult).items.filter(item => {
                const isSend = session.isSendedItem(item);
                return !isSend;
            });
            session.addItems(result.items);

            apiLogger.debug('result', result);

            res.send(result);

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * コンテンツ取得
 */
app.post(`/api/${GetContentsAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as GetContentsParam;
            const result = await getContents({
                param,
                currentMap: req.currentMap
            });

            apiLogger.debug('result', result);

            res.send(result);

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * カテゴリ取得
 */
app.post(`/api/${GetCategoryAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const result = await getCategory(req.currentMap);

            apiLogger.debug('result', result);

            res.send(result);

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * カテゴリ取得
 */
app.post(`/api/${GetEventsAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const result = await getEvents(req.currentMap);

            apiLogger.debug('result', result);

            res.send(result);

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * regist item
 * 位置アイテム登録
 */
app.post(`/api/${RegistItemAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as RegistItemParam;
            const mapPageId = req.currentMap.mapPageId;
            const mapKind = req.currentMap.mapKind;
        
            // call ODBA
            const id = await backendAPI.callOdbaApi(backendAPI.RegistItemAPI, {
                mapId: mapPageId,
                mapKind,
                geometry: param.geometry,
                geoProperties: param.geoProperties,
            });
    
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
            
            res.send(id);
    
        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * update item
 * 位置アイテム更新
 */
app.post(`/api/${UpdateItemAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as UpdateItemParam;

            // call ODBA
            await backendAPI.callOdbaApi(backendAPI.UpdateItemAPI, param);
    
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
            
            res.send('complete');
    
        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * update item
 * 位置アイテム削除
 */
app.post(`/api/${RemoveItemAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as RemoveItemParam;

            // call ODBA
            await backendAPI.callOdbaApi(backendAPI.RemoveItemAPI, param);
    
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'delete',
                itemPageIdList: [param.id],
            });
            
            res.send('complete');
    
        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * regist a content
 * コンテンツ登録
 */
app.post(`/api/${RegistContentAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as RegistContentParam;
            const mapPageId = req.currentMap.mapPageId;
    
            // call ODBA
            await backendAPI.callOdbaApi(backendAPI.RegistContentAPI, Object.assign({
                mapId: mapPageId,
            }, param));
    
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
        
            res.send('complete');
    
        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * update a content
 * コンテンツ更新
 */
app.post(`/api/${UpdateContentAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as UpdateContentParam;
            const mapId = req.currentMap.mapPageId;
    
            // call ODBA
            await backendAPI.callOdbaApi(backendAPI.UpdateContentAPI, Object.assign({
                mapId,
            }, param));
    
            // 更新通知
            broadCaster.broadcastSameMap(req, {
                type: 'updated',
            });
        
            res.send('complete');
    
        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * get unpointed conents
 * 地点未登録コンテンツ取得
 */
app.post(`/api/${GetUnpointDataAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as GetUnpointDataParam;

            // call ODBA
            const result = await backendAPI.callOdbaApi(backendAPI.GetUnpointDataAPI, {
                mapId: req.currentMap.mapPageId,
                mapKind: req.currentMap.mapKind,
                nextToken: param.nextToken,
            });
    
            res.send(result);
    
        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * link content to item
 * コンテンツをアイテムに紐づけ
 */
app.post(`/api/${LinkContentToItemAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as LinkContentToItemParam;

            // call ODBA
            await backendAPI.callOdbaApi(backendAPI.LinkContentToItemAPI, param);
    
            res.send('complete');
    
        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * remote the content
 * コンテンツ削除
 */
app.post(`/api/${RemoveContentAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as RemoveContentParam;

            // call ODBA
            await backendAPI.callOdbaApi(backendAPI.RemoveContentAPI, param);
    
            res.send('complete');
    
        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * get sns preview
 * SNSプレビュー取得
 */
app.post(`/api/${GetSnsPreviewAPI.uri}`,
    checkApiAuthLv(Auth.Edit), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.body as GetSnsPreviewParam;

            const result = await getSnsPreview(param);
    
            res.send(result);
    
        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * get thumbnail
 * サムネイル画像取得
 */
app.get('/api/getthumb',
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const id = req.query.id as string;
            const result = await getThumbnail(id);
    
            const bin = convertBase64ToBinary(result);
            res.writeHead(200, {
                'Content-Type': bin.contentType,
                'Content-Length': bin.binary.length
            });
            res.end(bin.binary);

        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * get original image's url.
 * オリジナル画像URL取得
 */
app.get('/api/getimageurl',
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.query as { id: string };

            // call odba
            return await backendAPI.callOdbaApi(backendAPI.GetImageUrlAPI, param);

        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * アイコン画像取得
 */
app.get('/api/geticon',
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.query as { id: string };

            const result = await getIcon(param);
            const bin = convertBase64ToBinary(result);
            res.writeHead(200, {
                'Content-Type': bin.contentType,
                'Content-Length': bin.binary.length
            });
            res.end(bin.binary);

            return false;

        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * 住所検索
 */
app.get('/api/geocoder',
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.query as GeocoderParam;
            const result = geocoder(param);
            res.send(result);
    
        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

/**
 * 住所検索結果Feature取得
 */
app.get('/api/getGeocoderFeature',
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const param = req.query as GetGeocoderFeatureParam;
            const result = getGeocoderFeature(param);
            res.send(result);

        } catch(e) {
            apiLogger.warn(e);
            res.status(500).send(e);
        }
    }
);

app.all('/api/*', (req) => {
    apiLogger.info('[end]', req.url, req.connect?.sessionKey);
});

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
