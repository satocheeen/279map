import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { Auth, MapKind, AuthMethod, ServerConfig, DataId, MapPageOptions, MapDefine, FilterDefine } from '279map-common';
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
import cors from 'cors';
import { exit } from 'process';
import { getMapInfoById } from './getMapDefine';
import { ConfigAPI, ConnectResult, GeocoderParam, GetGeocoderFeatureParam, GetItemsAPI, GetMapListAPI, GetSnsPreviewAPI, GetSnsPreviewParam, RegistItemAPI, RegistItemParam, UpdateItemAPI, UpdateItemParam } from '../279map-api-interface/src';
import { UserAuthInfo, getUserAuthInfoInTheMap, getUserIdByRequest } from './auth/getMapUser';
import { getMapPageInfo } from './getMapInfo';
import { GetItemsParam, GeocoderAPI, GetImageUrlAPI, GetThumbAPI, GetGeocoderFeatureAPI, RequestAPI, RequestParam, GetItemsByIdAPI, GetItemsByIdParam } from '../279map-api-interface/src/api';
import { getMapList } from './api/getMapList';
import { ApiError, ErrorType } from '../279map-api-interface/src/error';
import { search } from './api/search';
import { Auth0Management } from './auth/Auth0Management';
import { OriginalAuthManagement } from './auth/OriginalAuthManagement';
import { NoneAuthManagement } from './auth/NoneAuthManagement';
import { MapPageInfoTable } from '../279map-backend-common/src/types/schema';
import { CurrentMap, sleep } from '../279map-backend-common/src';
import { BroadcastItemParam, OdbaGetImageUrlAPI, OdbaGetLinkableContentsAPI, OdbaGetUnpointDataAPI, OdbaLinkContentDatasourceToMapAPI, OdbaLinkContentToItemAPI, OdbaRegistContentAPI, OdbaRegistItemAPI, OdbaRemoveContentAPI, OdbaRemoveItemAPI, OdbaUnlinkContentDatasourceFromMapAPI, OdbaUpdateContentAPI, OdbaUpdateItemAPI, callOdbaApi } from '../279map-backend-common/src/api';
import MqttBroadcaster from './session/MqttBroadcaster';
import SessionManager from './session/SessionManager';
import { geojsonToWKT } from '@terraformer/wkt';
import { getItem, getItemsById } from './api/getItem';
import { graphqlHTTP } from 'express-graphql';
import { loadSchemaSync } from '@graphql-tools/load';
import { join } from 'path';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { ContentConfig, DatasourceConfig, DatasourceKindType, ItemConfig, MutationChangeAuthLevelArgs, MutationLinkContentArgs, MutationLinkContentsDatasourceArgs, MutationRegistContentArgs, MutationRemoveContentArgs, MutationRemoveItemArgs, MutationSwitchMapKindArgs, MutationUnlinkContentArgs, MutationUnlinkContentsDatasourceArgs, MutationUpdateContentArgs, ParentOfContent, QueryGetCategoryArgs, QueryGetContentArgs, QueryGetContentsArgs, QueryGetContentsInItemArgs, QueryGetEventArgs, QueryGetUnpointContentsArgs, QuerySearchArgs, RealPointContentConfig, TrackConfig } from './graphql/__generated__/types';
import { MResolvers, MutationResolverReturnType, QResolvers, QueryResolverReturnType, Resolvers } from './graphql/type_utility';
import { authDefine } from './graphql/auth_define';
import { DataIdScalarType } from './graphql/custom_scalar';
import { makeExecutableSchema } from '@graphql-tools/schema'
import { CustomError } from './graphql/CustomError';
import { getLinkedItemIdList } from './api/apiUtility';
import SessionInfo from './session/SessionInfo';

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
            authLv: Auth;
        }
    }
}
type GraphQlContextType = {
    session: SessionInfo;
    sessionKey: string; // SID or Token
    // mapId: string;
    // mapPageInfo: MapPageInfoTable;
    userAuthInfo: UserAuthInfo;
    // userName?: string;
    currentMap: CurrentMap;
    authLv: Auth;
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
const sessionCheck = async(req: Request, res: Response, next: NextFunction) => {
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

/**
 * セッション状態をチェックする。
 * @returns セッションキー、接続中の地図情報
 * @throws セッション接続できていない場合
 */
const sessionCheckFunc = async(req: Request) => {
    const sessionKey = req.headers.sessionid;
    if (!sessionKey || typeof sessionKey !== 'string') {
        throw new CustomError({
            type: ErrorType.IllegalError,
            message: 'no sessionid in headers',
        })
    }
    apiLogger.info('[start]', req.url, sessionKey);

    const session = sessionManager.get(sessionKey);
    if (!session) {
        throw new CustomError({
            type: ErrorType.SessionTimeout,
            message: 'session timeout',
        })
    }
    // extend expired time of session
    session.extendExpire();

    return { 
        sessionKey,
        session,
    }
}

app.all('/api/*', sessionCheck);

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
const checkAuthorization = async(req: Request, res: Response, next: NextFunction) => {
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
}

app.all('/api/*', 
    checkAuthorization,
    authManagementClient.checkJwt,
    authenticateErrorProcess,
);

/**
 * check the user's auth Level.
 * set req.connect.authLv
 */
const checkUserAuthLv = async(req: Request, res: Response, next: NextFunction) => {
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

app.all('/api/*', checkUserAuthLv);

const checkGraphQlAuthLv = async(operationName: string, userAuthInfo: UserAuthInfo) => {
    if (!(operationName in authDefine)) {
        throw new CustomError({
            type: ErrorType.IllegalError,
            message: 'illegal operationName: ' + operationName,
        })
    }
    const needAuthLv = authDefine[operationName as Resolvers];
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
        if (!userAuthInfo) {
            return Auth.None;
        }
        switch(userAuthInfo.authLv) {
            case undefined:
            case Auth.None:
            case Auth.Request:
                return userAuthInfo.guestAuthLv;
            default:
                return userAuthInfo.authLv;
        }
    }();
    if (!userAuthLv || !allowAuthList.includes(userAuthLv)) {
        throw new CustomError({
            type: ErrorType.Unauthorized,
            message: 'user does not have authentication.'
        })
    }
    return userAuthLv;
}

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
        req.authLv = userAuthLv;
        if (!userAuthLv || !allowAuthList.includes(userAuthLv)) {
            res.status(403).send({
                type: ErrorType.OperationForbidden,
            } as ApiError);
            return;
        }
        next();
    }
}

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

const fileSchema = loadSchemaSync(
    [
        join(__dirname, './graphql/query.gql'),
        join(__dirname, './graphql/mutation.gql'),
    ],
    {
        loaders: [new GraphQLFileLoader()],
    }
);

// The root provides a resolver function for each API endpoint
type QueryResolverFunc = (parent: any, param: any, ctx: GraphQlContextType) => QueryResolverReturnType<any>;
type QueryResolver = Record<QResolvers, QueryResolverFunc>
type MutationResolverFunc<T extends MResolvers> = (parent: any, param: any, ctx: GraphQlContextType) => MutationResolverReturnType<T>;
type MutationResolver = Record<MResolvers, MutationResolverFunc<MResolvers>>;

// TODO:
const schema = makeExecutableSchema<GraphQlContextType>({
    typeDefs: fileSchema,
    resolvers: {
        Query: {
            /**
             * TODO: 要修正
             * get items
             * 地図アイテム取得
             */
            getItems: async(parent: any, param: GetItemsParam, ctx): QueryResolverReturnType<'getItems'> => {
                const session = sessionManager.get(ctx.sessionKey as string);
                console.log('session', session?.sid);

                console.log('getItems', param);
                await sleep(1);
                return [];
                // return [
                //     {
                //         id: {
                //             id: 'aa',
                //             dataSourceId: 'bb',
                //         },
                //         contents: [],
                //         // @ts-ignore
                //         geoJson: {},
                //         name: 'ccc',
                //         lastEditedTime: 'aaa'
                //     }
                // ];
            },
            /**
             * カテゴリ取得
             */
            getCategory: async(parent: any, param: QueryGetCategoryArgs, ctx): QueryResolverReturnType<'getCategory'> => {
                try {
                    const result = await getCategory(param, ctx.currentMap);
                    return result;

                } catch(e) {    
                    apiLogger.warn('getCategory error', param, e);
                    throw e;
                }

            },
            /**
             * イベント取得
             */
            getEvent: async(parent: any, param: QueryGetEventArgs, ctx): QueryResolverReturnType<'getEvent'> => {
                try {
                    const result = await getEvents(param, ctx.currentMap);
                    return result;

                } catch(e) {    
                    apiLogger.warn('getEvent error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツ取得（コンテンツID指定）
             */
            getContent: async(parent: any, param: QueryGetContentArgs, ctx): QueryResolverReturnType<'getContent'> => {
                try {
                    const result = await getContents({
                        param: [{
                            contentId: param.id,
                        }],
                        currentMap: ctx.currentMap,
                        authLv: ctx.authLv,
                    });
                    if (result.length === 0) {
                        throw new Error('not found');
                    }

                    return result[0];

                } catch(e) {    
                    apiLogger.warn('getContent error', param, e);
                    throw e;
                }
            },
            getContents: async(parent: any, param: QueryGetContentsArgs, ctx): QueryResolverReturnType<'getContents'> => {
                try {
                    const result = await getContents({
                        param: param.ids.map(id => {
                            return {
                                contentId: id,
                            }
                        }),
                        currentMap: ctx.currentMap,
                        authLv: ctx.authLv,
                    });

                    return result;

                } catch(e) {    
                    apiLogger.warn('getContent error', param, e);
                    throw e;
                }

            },
            /**
             * 指定のアイテムに属するコンテンツ取得
             */
            getContentsInItem: async(parent: any, param: QueryGetContentsInItemArgs, ctx): QueryResolverReturnType<'getContentsInItem'> => {
                try {
                    const result = await getContents({
                        param: [{
                            itemId: param.itemId,
                        }],
                        currentMap: ctx.currentMap,
                        authLv: ctx.authLv,
                    });

                    return result;

                } catch(e) {    
                    apiLogger.warn('getContentsInItem error', param, e);
                    throw e;
                }
            },
            getUnpointContents: async(parent: any, param: QueryGetUnpointContentsArgs, ctx): QueryResolverReturnType<'getUnpointContents'> => {
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
                        currentMap: ctx.currentMap,
                        dataSourceId: param.datasourceId,
                        nextToken: param.nextToken ?? undefined,
                    });
            
                    return result;

                } catch(e) {
                    apiLogger.warn('get-unpointdata API error', param, e);
                    throw e;
                }
            },
            /**
             * 検索
             */
            search: async(_, param: QuerySearchArgs, ctx): QueryResolverReturnType<'search'> => {
                try {
                    const conditions: FilterDefine[] = [];
                    param.condition.category?.forEach(category => {
                        conditions.push({
                            type: 'category',
                            category,
                        })
                    });
                    param.condition.date?.forEach(date => {
                        conditions.push({
                            type: 'calendar',
                            date,
                        })
                    });
                    param.condition.keyword?.forEach(keyword => {
                        conditions.push({
                            type: 'keyword',
                            keyword,
                        })
                    });
                    const result = await search(ctx.currentMap, param)
                    return result;

                } catch(e) {
                    apiLogger.warn('search API error', param, e);
                    throw e;
                }
            },
            getUserList: async(parent: any, _, ctx): QueryResolverReturnType<'getUserList'> => {
                try {
                    const mapId = ctx.currentMap.mapId;
                    const users = await authManagementClient.getUserList(mapId);
                    return users;
        
                } catch(e) {
                    apiLogger.warn('get-userlist API error', e);
                    throw e;
                }
            },
            /**
             * リンク可能なコンテンツ一覧を返す
             */
            getLinkableContentsDatasources: async(_, param, ctx): QueryResolverReturnType<'getLinkableContentsDatasources'> => {
                try {
                    // call odba
                    const result = await callOdbaApi(OdbaGetLinkableContentsAPI, {
                        currentMap: ctx.currentMap,
                    });
                    return result.contents;

                } catch(e) {
                    apiLogger.warn('get-linkable-contents API error', e);
                    throw e;
                }
            },
        } as QueryResolver,
        Mutation: {
            /**
             * 地図切り替え
             */
            switchMapKind: async(_, param: MutationSwitchMapKindArgs, ctx): MutationResolverReturnType<'switchMapKind'> => {
                try {
                    const result = await getMapInfo(
                        ctx.currentMap.mapId,
                        param.mapKind,
                        ctx.authLv,
                    );

                    ctx.session.setMapKind(param.mapKind);

                    apiLogger.debug('result', JSON.stringify(result,undefined,4));

                    return result;

                } catch(e) {    
                    apiLogger.warn(e);
                    throw e;
                }
            },
            /**
             * 位置アイテム削除
             */
            removeItem: async(parent: any, param: MutationRemoveItemArgs, ctx): MutationResolverReturnType<'removeItem'> => {
                try {
                    // call ODBA
                    await callOdbaApi(OdbaRemoveItemAPI, Object.assign({
                        currentMap: ctx.currentMap,
                    }, param));
            
                    // 更新通知
                    broadCaster.publish(ctx.currentMap.mapId, ctx.currentMap.mapKind, {
                        type: 'mapitem-delete',
                        itemPageIdList: [param.id],
                    });
                    
                    return true;

                } catch(e) {    
                    apiLogger.warn('remove-item API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツ登録
             */
            registContent: async(_, param: MutationRegistContentArgs, ctx): MutationResolverReturnType<'registContent'> => {
                try {
                    const { parent, datasourceId } = param;
                    // call ODBA
                    await callOdbaApi(OdbaRegistContentAPI, {
                        currentMap: ctx.currentMap,
                        parent: parent.type === ParentOfContent.Item ? {
                            itemId: parent.id,
                        } : {
                            contentId: parent.id,
                        },
                        contentDataSourceId: datasourceId,
                        categories: param.categories ?? [],
                        date: param.date ?? undefined,
                        imageUrl: param.imageUrl ?? undefined,
                        overview: param.overview ?? '',
                        title: param.title,
                        type: param.type,
                        url: param.url ?? undefined,
                    });
            
                    // TODO: OdbaRegistContentAPIの戻り値をcontentIdにして、それを元にgetContentsしてitemIdを取得するように変更する
                    // 更新通知
                    if (parent.type === ParentOfContent.Item) {
                        // 更新通知
                        const id = param.parent.id;
                        const wkt = await getItemWkt(id);
                        if (!wkt) {
                            logger.warn('not found extent', id);
                        } else {
                            broadCaster.publish(ctx.currentMap.mapId, ctx.currentMap.mapKind, {
                                type: 'childcontents-update',
                                subtype: {
                                    id: id.id,
                                    dataSourceId: id.dataSourceId,
                                },
                            });
                        }
                    }
                    return true;
            
                } catch(e) {    
                    apiLogger.warn('regist-content API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツ更新
             */
            updateContent: async(parent: any, param: MutationUpdateContentArgs, ctx): MutationResolverReturnType<'updateContent'> => {
                try {
                    // call ODBA
                    await callOdbaApi(OdbaUpdateContentAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        categories: param.categories ?? undefined,
                        date: param.date ?? undefined,
                        imageUrl: param.imageUrl ?? undefined,
                        overview: param.overview ?? undefined,
                        title: param.title ?? undefined,
                        type: param.type,
                        url: param.url ?? undefined,
                    });
            
                    // 更新通知
                    const target = (await getContents({
                        param: [
                            {
                                contentId: param.id,
                            }
                        ],
                        currentMap: ctx.currentMap,
                        authLv: ctx.authLv,
                    }))[0];

                    broadCaster.publish(ctx.currentMap.mapId, ctx.currentMap.mapKind, {
                        type: 'childcontents-update',
                        subtype: {
                            id: target.itemId.id,
                            dataSourceId: target.itemId.dataSourceId
                        }
                    });
                
                    return true;

                } catch(e) {
                    apiLogger.warn('update-content API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツをアイテムに紐づけ
             */
            linkContent: async(parent: any, param: MutationLinkContentArgs, ctx): MutationResolverReturnType<'linkContent'> => {
                try {
                    // call ODBA
                    await callOdbaApi(OdbaLinkContentToItemAPI, {
                        currentMap: ctx.currentMap,
                        childContentId: param.id,
                        parent: param.parent.type === ParentOfContent.Content ? {
                            contentId: param.parent.id,
                        } : {
                            itemId: param.parent.id,
                        }
                    });

                    // 更新通知
                    if (param.parent.type === ParentOfContent.Item) {
                        const id = param.parent.id;
                        const wkt = await getItemWkt(id);
                        if (!wkt) {
                            logger.warn('not found extent', id);
                        } else {
                            broadCaster.publish(ctx.currentMap.mapId, ctx.currentMap.mapKind, {
                                type: 'childcontents-update',
                                subtype: {
                                    id: id.id,
                                    dataSourceId: id.dataSourceId,
                                },
                            });
                        }
                    }

                    return true;
            
                } catch(e) {
                    apiLogger.warn('link-content2item API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツ削除
             */
            unlinkContent: async(parent: any, param: MutationUnlinkContentArgs, ctx): MutationResolverReturnType<'unlinkContent'> => {
                try {
                    // TODO: 親がコンテンツの場合の考慮（ODBA側のインタフェース対応後）
                    // call ODBA
                    await callOdbaApi(OdbaRemoveContentAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        itemId: param.parent.id,
                        mode: 'unlink',
                    });
            
                    // 更新通知
                    if (param.parent.type === ParentOfContent.Item) {
                        const id = param.parent.id;
                        const wkt = await getItemWkt(id);
                        if (!wkt) {
                            logger.warn('not found extent', id);
                        } else {
                            broadCaster.publish(ctx.currentMap.mapId, ctx.currentMap.mapKind, {
                                type: 'childcontents-update',
                                subtype: {
                                    id: id.id,
                                    dataSourceId: id.dataSourceId,
                                },
                            });
                        }
                    }

                    return true;

                } catch(e) {
                    apiLogger.warn('remove-content API error', param, e);
                    throw e;
                }
            },
            removeContent: async(parent: any, param: MutationRemoveContentArgs, ctx): MutationResolverReturnType<'removeContent'> => {
                try {
                    // 属するitem一覧を取得
                    const items = await getLinkedItemIdList(param.id);

                    // TODO: ODBA側のインタフェース対応
                    // call ODBA
                    await callOdbaApi(OdbaRemoveContentAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        itemId: {
                            dataSourceId: '',
                            id: '',
                        },
                        mode: 'alldelete',
                    });
            
                    // 更新通知(完了は待たずに復帰する)
                    Promise.all(items.map(async(item) => {
                        const wkt = await getItemWkt(item.itemId);
                        if (!wkt) {
                            logger.warn('not found extent', item.itemId);
                        } else {
                            broadCaster.publish(item.mapId, item.mapKind, {
                                type: 'childcontents-update',
                                subtype: {
                                    id: item.itemId.id,
                                    dataSourceId: item.itemId.dataSourceId
                                }
                            });
                        }
                    }));

                    return true;

                } catch(e) {
                    apiLogger.warn('remove-content API error', param, e);
                    throw e;
                }
            },
            /**
             * ユーザ権限変更
             */
            changeAuthLevel: async(parent: any, param: MutationChangeAuthLevelArgs, ctx): MutationResolverReturnType<'changeAuthLevel'> => {
                try {
                    const mapId = ctx.currentMap.mapId;
                    await authManagementClient.updateUserAuth({
                        mapId,
                        userId: param.userId,
                        authLv: param.authLv,
                    });
                    broadCaster.publish(mapId, undefined, {
                        type: 'userlist-update',
                    })
                    broadCaster.publishUserMessage(param.userId, {
                        type: 'update-userauth',
                    });
        
                    return true;

                } catch(e) {
                    apiLogger.warn('change-auth-level API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツデータソースを地図に追加
             */
            linkContentsDatasource: async(_, param: MutationLinkContentsDatasourceArgs, ctx): MutationResolverReturnType<'linkContentsDatasource'> => {
                try {
                    // call odba
                    await callOdbaApi(OdbaLinkContentDatasourceToMapAPI, {
                        currentMap: ctx.currentMap,
                        contents: param.contentsDatasources.map(d => ({
                            datasourceId: d.datasourceId,
                            name: d.name,
                        })),
                    });

                    broadCaster.publish(ctx.currentMap.mapId, undefined, {
                        type: 'mapinfo-update',
                    })

                    return true;

                } catch(e) {
                    apiLogger.warn('link-contents-to-map API error', e);
                    throw e;
                }
            },
            /**
             * コンテンツデータソースを地図から除去
             */
            unlinkContentsDatasource: async(_, param: MutationUnlinkContentsDatasourceArgs, ctx): MutationResolverReturnType<'unlinkContentsDatasource'> => {
                try {
                    // call odba
                    await callOdbaApi(OdbaUnlinkContentDatasourceFromMapAPI, {
                        currentMap: ctx.currentMap,
                        contents: param.contentsDatasourceIds.map(datasourceId => ({
                            datasourceId,
                        })),
                    });

                    broadCaster.publish(ctx.currentMap.mapId, undefined, {
                        type: 'mapinfo-update',
                    })

                    return true;

                } catch(e) {
                    apiLogger.warn('unlink-contents-from-map API error', e);
                    throw e;
                }
            },
        } as MutationResolver,
        DataId: DataIdScalarType,
        DatasourceConfig: {
            __resolveType: (obj: DatasourceConfig, parent: any) => {
                console.log('debug', obj, parent)
                switch(obj.kind) {
                    case DatasourceKindType.Item:
                        return 'ItemConfig';
                    case DatasourceKindType.RealPointContent:
                        return 'RealPointContentConfig';
                    case DatasourceKindType.Content:
                        return 'ContentConfig';
                    case DatasourceKindType.Track:
                        return 'TrackConfig';
                }
            }
        }
    }
})

app.use(
    "/graphql",
    authManagementClient.checkJwt,
    authenticateErrorProcess,
    graphqlHTTP(async(req, res, graphQLParams) => {
        const operationName = graphQLParams?.operationName;
        if (!operationName) {
            throw new CustomError({
                type: ErrorType.IllegalError,
                message: 'no operation name'
            })
        }
        const { sessionKey, session } = await sessionCheckFunc(req as Request);
        const mapPageInfo = await getMapPageInfo(session.currentMap.mapId);
        if (!mapPageInfo) {
            throw new CustomError({
                type: ErrorType.UndefinedMap,
                message: 'map not found'
            })
        }

        const userAuthInfo = await getUserAuthInfoInTheMap(mapPageInfo, req as Request);
        if (!req.headers.authorization) {
            // 未ログインの場合は、ゲストユーザ権限があるか確認
            if (!userAuthInfo) {
                throw new CustomError({
                    type: ErrorType.Unauthorized,
                    message: 'Unauthenticated.this map is private, please login.',
                })
            }        
        }

        const authLv = await checkGraphQlAuthLv(operationName, userAuthInfo);
        const context: GraphQlContextType = {
            // mapId: session.currentMap.mapId,
            sessionKey,
            session,
            // mapPageInfo,
            userAuthInfo,
            currentMap: session.currentMap,
            authLv,
        }

        return {
            schema,
            graphiql: true,
            context,
        }
    }),
)

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
