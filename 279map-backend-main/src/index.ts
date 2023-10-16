import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { Auth, MapKind, AuthMethod, ServerConfig, DataId, MapPageOptions, MapDefine } from '279map-common';
import { getItems } from './getItems';
import { configure, getLogger } from "log4js";
import { DbSetting, LogSetting } from './config';
import { getThumbnail } from './getThumbnsil';
import { getContents } from './getContents';
import { getEvents } from './getEvents';
import proxy from 'express-http-proxy';
import http from 'http';
import { convertBase64ToBinary, getItemWkt } from './util/utility';
import { geocoder, getGeocoderFeature } from './api/geocoder';
import { getCategory } from './api/getCategory';
import { getSnsPreview } from './api/getSnsPreview';
import { getOriginalIconDefine } from './api/getOriginalIconDefine';
import cors from 'cors';
import { exit } from 'process';
import { getMapInfoById } from './getMapDefine';
import { ConfigAPI, ConnectResult, GeocoderParam, GetCategoryAPI, GetContentsAPI, GetContentsParam, GetEventsAPI, GetGeocoderFeatureParam, GetItemsAPI, GetMapInfoAPI, GetMapInfoParam, GetMapListAPI, GetOriginalIconDefineAPI, GetSnsPreviewAPI, GetSnsPreviewParam, GetUnpointDataAPI, GetUnpointDataParam, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, RegistItemAPI, RegistItemParam, RemoveContentAPI, RemoveContentParam, RemoveItemAPI, RemoveItemParam, UpdateContentAPI, UpdateContentParam, UpdateItemAPI, UpdateItemParam } from '../279map-api-interface/src';
import { UserAuthInfo, getUserAuthInfoInTheMap, getUserIdByRequest } from './auth/getMapUser';
import { getMapPageInfo } from './getMapInfo';
import { GetItemsParam, GeocoderAPI, GetImageUrlAPI, GetThumbAPI, GetGeocoderFeatureAPI, SearchAPI, SearchParam, GetEventParam, GetCategoryParam, RequestAPI, RequestParam, GetUserListAPI, GetUserListResult, ChangeAuthLevelAPI, ChangeAuthLevelParam, GetItemsByIdAPI, GetItemsByIdParam } from '../279map-api-interface/src/api';
import { getMapList } from './api/getMapList';
import { ApiError, ErrorType } from '../279map-api-interface/src/error';
import { search } from './api/search';
import { Auth0Management } from './auth/Auth0Management';
import { OriginalAuthManagement } from './auth/OriginalAuthManagement';
import { NoneAuthManagement } from './auth/NoneAuthManagement';
import { MapPageInfoTable } from '../279map-backend-common/src/types/schema';
import { CurrentMap, sleep } from '../279map-backend-common/src';
import { BroadcastItemParam, OdbaGetImageUrlAPI, OdbaGetUnpointDataAPI, OdbaLinkContentToItemAPI, OdbaRegistContentAPI, OdbaRegistItemAPI, OdbaRemoveContentAPI, OdbaRemoveItemAPI, OdbaUpdateContentAPI, OdbaUpdateItemAPI, callOdbaApi } from '../279map-backend-common/src/api';
import MqttBroadcaster from './session/MqttBroadcaster';
import SessionManager from './session/SessionManager';
import { geojsonToWKT } from '@terraformer/wkt';
import { getItem, getItemsById } from './api/getItem';

declare global {
    namespace Express {
        interface Request {
            connect?: {
                sessionKey: string; // SID or Token
                mapId: string;
                mapPageInfo?: MapPageInfoTable;
                userAuthInfo?: UserAuthInfo;
                // userName?: string;
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
// 必須環境変数が定義されているかチェック
if (!process.env.MAIN_SERVICE_PORT) {
    console.warn('not set env MAIN_SERVICE_PORT');
    exit(1);
}
if (!process.env.SESSION_STORAGE_PATH) {
    console.warn('not set env SESSION_STORAGE_PATH');
    exit(1);
}
const sessionStoragePath = process.env.SESSION_STORAGE_PATH;
if (!process.env.AUTH_METHOD) {
    console.warn('not set env AUTH_METHOD');
    exit(1);
}

logger.info('start prepare express');

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
const server = http.createServer(app);

// Create Broadcast Server
const broadCaster = new MqttBroadcaster(server);

// Session Manager
const sessionManager = new SessionManager(sessionStoragePath);

/**
 * Initialize Auth
 */
export const authMethod = process.env.AUTH_METHOD as AuthMethod;
export const authManagementClient = function() {
    switch(authMethod) {
        case AuthMethod.Auth0:
            return new Auth0Management()
        case AuthMethod.Original:
            return new OriginalAuthManagement();
        case AuthMethod.None:
            return new NoneAuthManagement();
        default:
            console.warn('illegal value AUTH_METHOD: ' + process.env.AUTH_METHOD);
            exit(1);
        }
}();
authManagementClient.initialize();

/**
 * システム共通定義を返す
 */
app.get(`/api/${ConfigAPI.uri}`, async(_, res) => {
    if (authMethod === AuthMethod.Auth0) {
        const result = {
            authMethod: AuthMethod.Auth0,
            auth0: {
                domain: process.env.AUTH0_DOMAIN,
                clientId: process.env.AUTH0_FRONTEND_CLIENT_ID,
                audience: process.env.AUTH0_AUDIENCE,
            }
        } as ServerConfig;
        res.send(result);
    } else {
        res.send({
            authMethod,
        } as ServerConfig)
    }
});

/**
 * ログインユーザーがアクセス可能な地図一覧を返す。
 * ログインしていないユーザーの場合は、Public地図のみ返す
 */
app.get('/api/' + GetMapListAPI.uri,
    async(req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            // 未ログインの場合は、認証チェックしない
            next('route');
            return;

        } else {
            // 認証情報ある場合は、後続の認証チェック処理
            next();
        }
    },
    authManagementClient.checkJwt,
);
app.get('/api/' + GetMapListAPI.uri,
    async(req: Request, res: Response) => {
        apiLogger.info('[start] getmaplist');

        const userId = getUserIdByRequest(req);
        if (userId) {
            await authManagementClient.getUserMapList(userId);
        }
        const list = await getMapList(userId);

        res.send(list);

        apiLogger.info('[end] getmaplist');
    }
);

const authenticateErrorProcess = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // 認証エラー
    apiLogger.warn('connect error', err);
    if (err.name === 'Unauthenticated') {
        res.status(401).send({
            type: ErrorType.Unauthorized,
            detail: err.message,
        } as ApiError);
    } else if (err.name === 'Bad Request') {
        res.status(400).send({
            type: ErrorType.IllegalError,
            detail: err.message,
        } as ApiError);
    } else {
        res.status(403).send({
            type: ErrorType.Forbidden,
            detail: err.message + err.stack,
        } as ApiError);
    }
};

/**
 * 接続確立
 */
app.get('/api/connect', 
    authManagementClient.checkJwt,
    authenticateErrorProcess,
    async(req: Request, res: Response) => {
        apiLogger.info('[start] connect', req.query);

        try {
            const queryMapId = req.query.mapId;
            if (!queryMapId || typeof queryMapId !== 'string') {
                res.status(400).send({
                    type: ErrorType.UndefinedMap,
                    detail: 'not set mapId',
                } as ApiError);
                return;
            }
            const mapInfo = await getMapInfoById(queryMapId);
            if (mapInfo === null) {
                res.status(400).send({
                    type: ErrorType.UndefinedMap,
                    detail: 'mapId is not found : ' + queryMapId,
                } as ApiError);
                return;
            }

            const userAccessInfo = await getUserAuthInfoInTheMap(mapInfo, req, true);
            if (userAccessInfo.authLv === undefined && userAccessInfo.guestAuthLv === Auth.None) {
                // ログインが必要な地図の場合
                res.status(403).send({
                    type: ErrorType.Unauthorized,
                } as ApiError);
                return;
            }

            const mapDefine: MapDefine = Object.assign({
                mapId: mapInfo.map_page_id,
                name: mapInfo.title,
                useMaps: mapInfo.use_maps.split(',').map(mapKindStr => {
                    return mapKindStr as MapKind;
                }),
                defaultMapKind: mapInfo.default_map,
                options: mapInfo.options as MapPageOptions,
            }, 
            (userAccessInfo.authLv === undefined || userAccessInfo.authLv === Auth.None || userAccessInfo.authLv === Auth.Request)
                ? {
                    authLv: userAccessInfo.authLv ?? Auth.None,
                    guestAuthLv: userAccessInfo.guestAuthLv,
                }
                : {
                    authLv: userAccessInfo.authLv,
                    // @ts-ignore なぜかTypeScriptエラーになるので
                    userName: userAccessInfo.userName,
                });

            if (userAccessInfo.authLv === Auth.None && userAccessInfo.guestAuthLv === Auth.None) {
                // 権限なしエラーを返却
                res.status(403).send({
                    type: ErrorType.NoAuthenticate,
                    userId: userAccessInfo.userId,
                } as ApiError);
                return;
            }
            if (userAccessInfo.authLv === Auth.Request && userAccessInfo.guestAuthLv === Auth.None) {
                // 承認待ちエラーを返却
                res.status(403).send({
                    type: ErrorType.Requesting,
                    userId: userAccessInfo.userId,
                } as ApiError);
                return;
            }

            const session = sessionManager.createSession({
                mapId: mapInfo.map_page_id,
                mapKind: mapInfo.default_map,
            });
        
            const result: ConnectResult = {
                mapDefine,
                sid: session.sid,
                userId: userAccessInfo.userId,
            }

            res.send(result);
            apiLogger.info('[end] connect', session.sid);
        
        } catch(e) {
            apiLogger.warn('connect error', e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail: e + '',
            } as ApiError);

        }
    },
);

/**
 * 地図へのユーザ登録申請
 */
app.post(`/api/${RequestAPI.uri}`, 
    authManagementClient.checkJwt,
    authenticateErrorProcess,
    async(req: Request, res: Response) => {

        try {
            const param = req.body as RequestParam;
            apiLogger.info('[start] request', param);

            const queryMapId = param.mapId;
            const mapInfo = await getMapInfoById(queryMapId);
            if (mapInfo === null) {
                res.status(400).send({
                    type: ErrorType.UndefinedMap,
                    detail: 'mapId is not found : ' + queryMapId,
                } as ApiError);
                return;
            }

            const userId = getUserIdByRequest(req);
            if (!userId) {
                throw new Error('userId undefined');
            }
            await authManagementClient.requestForEnterMap({
                userId,
                mapId: mapInfo.map_page_id,
                name: param.name,
                newUserAuthLevel: (mapInfo.options as MapPageOptions)?.newUserAuthLevel ?? Auth.None,
            });
            res.send('ok');

            // publish
            broadCaster.publish(queryMapId, undefined, {
                type: 'userlist-update',
            })
            broadCaster.publishUserMessage(userId, {
                type: 'update-userauth',
            });

        } catch(e) {
            apiLogger.warn('request error', e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail: e + '',
            } as ApiError);
        } finally {
            apiLogger.info('[end] request');

        }
    }
);

/**
 * セッション情報を取得してrequestに格納
 */
app.all('/api/*', 
    async(req: Request, res: Response, next: NextFunction) => {
        const sessionKey = req.headers.sessionid;
        if (!sessionKey || typeof sessionKey !== 'string') {
            res.status(400).send({
                type: ErrorType.IllegalError,
                detail: 'no sessionid in headers',
            } as ApiError);
            return;
        }
        apiLogger.info('[start]', req.url, sessionKey);

        const session = sessionManager.get(sessionKey);
        if (!session) {
            res.status(400).send({
                type: ErrorType.SessionTimeout,
                detail: 'the session not found.' + sessionKey,
            } as ApiError);
            return;
        }
        req.connect = { 
            sessionKey,
            mapId: session.currentMap.mapId
        };
        next();
    }
);

/**
 * 切断
 */
app.get('/api/disconnect', async(req, res) => {
    if (req.connect) {
        sessionManager.delete(req.connect.sessionKey);
    }

    res.send('disconnect');
});

/**
 * Authorization.
 * set connect.mapPageInfo, auth in this process.
 * 認証チェック。チェックの課程で、connect.mapPageInfo, authに値設定。
 */
app.all('/api/*', 
    async(req: Request, res: Response, next: NextFunction) => {
        if (!req.connect) {
            // 手前で弾かれているはずなので、ここには来ないはず
            apiLogger.error('connect not found.');
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail: 'Illegal state error.  connect not found.',
            } as ApiError);
            return;
        }
        apiLogger.info('authorization', req.connect);

        const mapId = req.connect.mapId;

        // 地図情報取得
        const mapPageInfo = await getMapPageInfo(mapId);
        if (!mapPageInfo) {
            res.status(400).send({
                type: ErrorType.UndefinedMap,
                detail: 'map not found.',
            } as ApiError);
            return;
        }
        req.connect.mapPageInfo = mapPageInfo;

        // checkJWTを実行する必要があるかどうかチェック
        if (!req.headers.authorization) {
            // 未ログインの場合は、ゲストユーザ権限があるか確認
            const userAuthInfo = await getUserAuthInfoInTheMap(mapPageInfo, req);
            if (!userAuthInfo) {
                apiLogger.debug('not auth');
                next({
                    name: 'Unauthenticated',
                    message: 'this map is private, please login.',
                });
            } else {
                apiLogger.debug('skip checkJwt');
                next('route');
            }
        
        } else {
            // 認証情報ある場合は、後続の認証チェック処理
            next();
        }
    },
    authManagementClient.checkJwt,
    authenticateErrorProcess,
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
            // 手前で弾かれているはずなので、ここには来ないはず
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail: 'Illegal state error.',
            } as ApiError);
            return;
        }

        const userAuth = await getUserAuthInfoInTheMap(mapDefine, req);
        if (!userAuth) {
            // ログインが必要な地図の場合
            res.status(403).send({
                type: ErrorType.Unauthorized,
            } as ApiError);
            return;
        }
        req.connect.userAuthInfo = userAuth;
        next();
    }
);

const checkApiAuthLv = (needAuthLv: Auth) => {
    return async(req: Request, res: Response, next: NextFunction) => {
        let allowAuthList: Auth[];
        switch(needAuthLv) {
            case Auth.View:
                allowAuthList = [Auth.View, Auth.Edit, Auth.Admin];
                break;
            case Auth.Edit:
                allowAuthList = [Auth.Edit, Auth.Admin];
                break;
            default:
                allowAuthList = [Auth.Admin];
        }
        const userAuthLv = function() {
            if (!req.connect?.userAuthInfo) {
                return Auth.None;
            }
            switch(req.connect.userAuthInfo.authLv) {
                case undefined:
                case Auth.None:
                case Auth.Request:
                    return req.connect.userAuthInfo.guestAuthLv;
                default:
                    return req.connect.userAuthInfo.authLv;
            }
        }();
        if (!userAuthLv || !allowAuthList.includes(userAuthLv)) {
            res.status(403).send({
                type: ErrorType.OperationForbidden,
            } as ApiError);
            return;
        }
        next();
    }
}

// 地図基本情報取得
app.post(`/api/${GetMapInfoAPI.uri}`, 
    checkApiAuthLv(Auth.View), 
    async(req, res, next) => {
        try {
            const session = sessionManager.get(req.connect?.sessionKey as string);
            if (!session) {
                throw 'no session';
            }

            const param = req.body as GetMapInfoParam;

            const result = await getMapInfo({
                mapId: session.currentMap.mapId,
                param
            });

            // TODO
            if (session) {
                session.setMapKind(result.mapKind);
            }

            apiLogger.debug('result', result);

            res.send(result);

            next();

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * check whether connecting map and set the value of req.currentMap
 */
const checkCurrentMap = async(req: Request, res: Response, next: NextFunction) => {
    const session = sessionManager.get(req.connect?.sessionKey as string);
    if (!session) {
        res.status(409).send({
            type: ErrorType.SessionTimeout,
        } as ApiError);
        return;
    }
    req.currentMap = session.currentMap;

    // extend expired time of session
    session.extendExpire();
    next();
}


/**
 * get original icon define
 * オリジナルアイコン情報取得
 */
app.post(`/api/${GetOriginalIconDefineAPI.uri}`, 
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res, next) => {
        try {
            const result = await getOriginalIconDefine(req.currentMap);

            apiLogger.debug('result', result);

            res.send(result);

            next();

        } catch(e) {    
            apiLogger.warn(e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as GetItemsParam;
        try {
            const session = sessionManager.get(req.connect?.sessionKey as string);
            if (!session) {
                throw new Error('session undefined');
            }
            
            const result = await getItems({
                param,
                currentMap: req.currentMap,
            });

            // 仮登録中の情報を付与して返す
            session.addTemporaryItems(result.items, req.currentMap);

            // apiLogger.debug('result', result);

            res.send(result);

            next();

        } catch(e) {
            apiLogger.warn('get-items API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * get items by id
 * 地図アイテム取得(ID指定)
 */
app.post(`/api/${GetItemsByIdAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res, next) => {
        const param = req.body as GetItemsByIdParam;
        try {
            const session = sessionManager.get(req.connect?.sessionKey as string);
            if (!session) {
                throw new Error('session undefined');
            }
            
            const result = await getItemsById(param);

            // 仮登録中の情報を付与して返す
            session.mergeTemporaryItems(result.items, req.currentMap, param.targets);

            res.send(result);

            next();

        } catch(e) {
            apiLogger.warn('get-items-by-id API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * コンテンツ取得
 */
app.post(`/api/${GetContentsAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res, next) => {
        const param = req.body as GetContentsParam;
        try {
            const result = await getContents({
                param,
                currentMap: req.currentMap,
            });

            apiLogger.debug('result', result);

            res.send(result);

            next();
        } catch(e) {    
            apiLogger.warn('get-contents API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * カテゴリ取得
 */
app.post(`/api/${GetCategoryAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res, next) => {
        const param = req.body as GetCategoryParam;
        try {
            const result = await getCategory(param, req.currentMap);

            apiLogger.debug('result', result);

            res.send(result);

            next();
        } catch(e) {    
            apiLogger.warn('get-category API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * イベント取得
 */
app.post(`/api/${GetEventsAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res, next) => {
        const param = req.body as GetEventParam;
        try {
            const result = await getEvents(param, req.currentMap);

            apiLogger.debug('result', result);

            res.send(result);

            next();
        } catch(e) {    
            apiLogger.warn('get-events API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as RegistItemParam;
        try {
            // メモリに仮登録
            const session = sessionManager.get(req.connect?.sessionKey as string);
            if (!session) {
                throw new Error('session undefined');
            }
            const tempID = session.addTemporaryRegistItem(req.currentMap, param);
        
            const wkt = geojsonToWKT(param.geometry);
            // call ODBA
            callOdbaApi(OdbaRegistItemAPI, {
                currentMap: req.currentMap,
                dataSourceId: param.dataSourceId,
                name: param.name,
                geometry: param.geometry,
                geoProperties: param.geoProperties,
            }).then(async(id) => {
                // 更新通知
                broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                    type: 'mapitem-insert',
                    targets: [
                        {
                            id,
                            wkt,
                        }
                    ]
                });
            }).catch(e => {
                apiLogger.warn('callOdba-registItem error', e);
                // TODO: フロントエンドにエラーメッセージ表示

                // メモリから除去
                session.removeTemporaryItem(tempID);
                // 仮アイテム削除通知
                broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                    type: 'mapitem-delete',
                    itemPageIdList: [{
                        id: tempID,
                        dataSourceId: param.dataSourceId,
                    }],
                });
            }).finally(() => {
                // メモリから除去
                session.removeTemporaryItem(tempID);

                // 仮アイテム削除通知
                broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                    type: 'mapitem-delete',
                    itemPageIdList: [{
                        id: tempID,
                        dataSourceId: param.dataSourceId,
                    }],
                });
            })

            // 仮アイテム描画させるための通知
            broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                type: 'mapitem-insert',
                targets: [
                    {
                        id: {
                            id: tempID,
                            dataSourceId: param.dataSourceId,
                        },
                        wkt,
                    }
                ]
            });
            
            res.send('ok');
    
            next();
        } catch(e) {    
            apiLogger.warn('regist-item API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as UpdateItemParam;
        try {
            const session = sessionManager.get(req.connect?.sessionKey as string);
            if (!session) {
                throw new Error('session undefined');
            }
            // メモリに仮登録
            const targets = await Promise.all(param.targets.map(async(target) => {
                const currentItem = await getItem(target.id);
                if (!currentItem) {
                    throw new Error('item not found: ' + target.id);
                }
                const tempID = session.addTemporaryUpdateItem(req.currentMap, currentItem, target);

                const beforeWkt = await getItemWkt(target.id);
                if (!beforeWkt) {
                    throw new Error('wkt not found');
                }
                const afterWkt = target.geometry ? geojsonToWKT(target.geometry) : undefined;
                return {
                    target,
                    tempID,
                    wkt: afterWkt ?? beforeWkt,
                }
            }));

            // 仮アイテム描画させるための通知
            broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                type: 'mapitem-update',
                targets: targets.map(t => {
                    return {
                        id: t.target.id,
                        wkt: t.wkt,
                    }
                })
            });
            res.send('complete');
            for (const target of targets) {
                // call ODBA
                callOdbaApi(OdbaUpdateItemAPI, Object.assign({
                    currentMap: req.currentMap,
                }, target.target))
                .catch(e => {
                    apiLogger.warn('callOdba-updateItem error', e);
                    // TODO: フロントエンドにエラーメッセージ表示
                }).finally(() => {
                    // メモリから除去
                    session.removeTemporaryItem(target.tempID);

                    // 更新通知
                    broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                        type: 'mapitem-update',
                        targets: [
                            {
                                id: target.target.id,
                                wkt: target.wkt,
                            }
                        ]
                    });
                })
            }
        
    
            next();
        } catch(e) {    
            apiLogger.warn('update-item API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as RemoveItemParam;
        try {
            // call ODBA
            await callOdbaApi(OdbaRemoveItemAPI, Object.assign({
                currentMap: req.currentMap,
            }, param));
    
            // 更新通知
            broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                type: 'mapitem-delete',
                itemPageIdList: [param.id],
            });
            
            res.send('complete');
    
            next();
        } catch(e) {    
            apiLogger.warn('remove-item API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as RegistContentParam;
        try {
            // call ODBA
            await callOdbaApi(OdbaRegistContentAPI, Object.assign({
                currentMap: req.currentMap,
            }, param));
    
            // TODO: OdbaRegistContentAPIの戻り値をcontentIdにして、それを元にgetContentsしてitemIdを取得するように変更する
            // 更新通知
            if ('itemId' in param.parent) {
                // 更新通知
                const id = param.parent.itemId;
                const wkt = await getItemWkt(id);
                if (!wkt) {
                    logger.warn('not found extent', id);
                } else {
                    broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                        type: 'mapitem-update',
                        targets: [
                            {
                                id,
                                wkt,
                            }
                        ]
                    });
                }
            }
       
            res.send('complete');
    
            next();
        } catch(e) {    
            apiLogger.warn('regist-content API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as UpdateContentParam;
        try {
            // call ODBA
            await callOdbaApi(OdbaUpdateContentAPI, Object.assign({
                currentMap: req.currentMap,
            }, param));
    
            // 更新通知
            const target = (await getContents({
                param: [
                    {
                        contentId: param.id,
                    }
                ],
                currentMap: req.currentMap,
            })).contents[0];

            broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                type: 'childcontents-update',
                subtype: target.itemId,
            });
        
            res.send('complete');
    
            next();
        } catch(e) {
            apiLogger.warn('update-content API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as GetUnpointDataParam;
        try {
            // 指定のアイテムに対して紐づけ可能なデータソースか確認
            // -> 紐づけ対象のアイテム情報をもらうインタフェースになっていないので、現状はコメントアウト
            // const checkOk = await checkLinkableDatasource(req.currentMap, param.dataSourceId);
            // if (!checkOk) {
            //     apiLogger.warn('check NG');
            //     res.send({
            //         contents: [],
            //     })
            //     return;
            // }

            // call ODBA
            const result = await callOdbaApi(OdbaGetUnpointDataAPI, {
                currentMap: req.currentMap,
                dataSourceId: param.dataSourceId,
                nextToken: param.nextToken,
            });
    
            res.send(result);
    
            next();
        } catch(e) {
            apiLogger.warn('get-unpointdata API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as LinkContentToItemParam;
        try {
            // call ODBA
            await callOdbaApi(OdbaLinkContentToItemAPI, Object.assign({
                currentMap: req.currentMap,
            }, param));

            // 更新通知
            if ('itemId' in param.parent) {
                const id = param.parent.itemId;
                const wkt = await getItemWkt(id);
                if (!wkt) {
                    logger.warn('not found extent', id);
                } else {
                    broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                        type: 'mapitem-update',
                        targets: [
                            {
                                id,
                                wkt,
                            }
                        ]
                    });
                }
            }
            
            res.send('complete');

            next();
    
        } catch(e) {
            apiLogger.warn('link-content2item API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as RemoveContentParam;
        try {
            // call ODBA
            await callOdbaApi(OdbaRemoveContentAPI, Object.assign({
                currentMap: req.currentMap,
            }, param));
    
            // 更新通知
            const id = param.itemId;
            const wkt = await getItemWkt(id);
            if (!wkt) {
                logger.warn('not found extent', id);
            } else {
                broadCaster.publish(req.currentMap.mapId, req.currentMap.mapKind, {
                    type: 'mapitem-update',
                    targets: [
                        {
                            id,
                            wkt,
                        }
                    ]
                });
            }

            res.send('complete');
    
            next();
        } catch(e) {
            apiLogger.warn('remove-content API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
    async(req, res, next) => {
        const param = req.body as GetSnsPreviewParam;
        try {
            const result = await getSnsPreview(param);
    
            res.send(result);
    
            next();
        } catch(e) {
            apiLogger.warn('get-sns-preview API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * search items and contents
 * 検索
 */
app.post(`/api/${SearchAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res, next) => {
        const param = req.body as SearchParam;
        try {
            const result = await search(req.currentMap, param);
            res.send(result);

            next();
        } catch(e) {
            apiLogger.warn('search API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * get thumbnail
 * サムネイル画像取得
 */
app.get(`/api/${GetThumbAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        const id = req.query.id as string;
        try {
            const result = await getThumbnail(id);
    
            const bin = convertBase64ToBinary(result);
            res.writeHead(200, {
                'Content-Type': bin.contentType,
                'Content-Length': bin.binary.length
            });
            res.end(bin.binary);

        } catch(e) {
            apiLogger.warn('get-thumb error', id, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * get original image's url.
 * オリジナル画像URL取得
 */
app.post(`/api/${GetImageUrlAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        const param = req.body as { id: DataId };
        try {
            // call odba
            const result = await callOdbaApi(OdbaGetImageUrlAPI, param);
            res.send(result);

        } catch(e) {
            apiLogger.warn('get-imageurl API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * 住所検索
 */
app.post(`/api/${GeocoderAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        const param = req.body as GeocoderParam;
        try {
            const result = await geocoder(param);
            res.send(result);
    
        } catch(e) {
            apiLogger.warn('geocoder API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * 住所検索結果Feature取得
 */
app.get(`/api/${GetGeocoderFeatureAPI.uri}`,
    checkApiAuthLv(Auth.View), 
    checkCurrentMap,
    async(req, res) => {
        const param = req.query as GetGeocoderFeatureParam;
        try {
            const result = await getGeocoderFeature(param);
            res.send(result);

        } catch(e) {
            apiLogger.warn('get-geocoder-feature API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

app.post(`/api/${GetUserListAPI.uri}`,
    checkApiAuthLv(Auth.Admin), 
    checkCurrentMap,
    async(req, res) => {
        try {
            const mapId = req.currentMap.mapId;
            const users = await authManagementClient.getUserList(mapId);
            res.send({
                users,
            } as GetUserListResult);

        } catch(e) {
            apiLogger.warn('get-userlist API error', e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
        }
    }
);

/**
 * ユーザ権限変更
 */
app.post(`/api/${ChangeAuthLevelAPI.uri}`,
    checkApiAuthLv(Auth.Admin), 
    checkCurrentMap,
    async(req, res) => {
        const param = req.body as ChangeAuthLevelParam;
        try {
            const mapId = req.currentMap.mapId;
            await authManagementClient.updateUserAuth({
                mapId,
                userId: param.userId,
                authLv: param.authLv,
            });
            res.send('ok');
            broadCaster.publish(mapId, undefined, {
                type: 'userlist-update',
            })
            broadCaster.publishUserMessage(param.userId, {
                type: 'update-userauth',
            });

        } catch(e) {
            apiLogger.warn('change-auth-level API error', param, e);
            res.status(500).send({
                type: ErrorType.IllegalError,
                detail : e + '',
            } as ApiError);
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
internalApp.post('/api/broadcast', async(req: Request, res: Response) => {
    const param = req.body as BroadcastItemParam;
    logger.info('broadcast', param);
    // 変更範囲を取得する
    const itemIdListByDataSource = param.itemIdList.reduce((acc, cur) => {
        if (cur.dataSourceId in acc) {
            acc[cur.dataSourceId].push(cur);
        } else {
            acc[cur.dataSourceId] = [cur];
        }
        return acc;
    }, {} as {[datasourceId: string]: DataId[]});
    const targets = [] as {id: DataId; wkt: string}[];
    for (const entry of Object.entries(itemIdListByDataSource)) {
        const itemIdList = entry[1];
        for (const itemId of itemIdList) {
            const wkt = await getItemWkt(itemId);
            if (wkt) {
                targets.push({
                    id: itemId,
                    wkt,
                })
            }
        }
    }
    switch(param.operation) {
        case 'insert':
            broadCaster.publish(param.mapId, undefined, {
                type: 'mapitem-update',
                targets,
            });
            break;
        case 'update':
            broadCaster.publish(param.mapId, undefined, {
                type: 'mapitem-update',
                targets,
            });
            break;
        case 'delete':
            broadCaster.publish(param.mapId, undefined, {
                type: 'mapitem-delete',
                itemPageIdList: param.itemIdList
            });
            break;
    }
	res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(201).send('broadcasted.');
});

/**
 * 有効期限切れセッション削除（定期監視）
 */
const checkSessionProcess = () => {
    try {
        sessionManager.removeExpiredSessions();

    } catch(e) {
        logger.warn('更新チェック失敗', e);

    } finally {
        setTimeout(() => {
            checkSessionProcess();
        }, 1 * 60000); // 1分ごとにチェック
    }
}

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
    checkSessionProcess();
});
