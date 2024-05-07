import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { getItems } from './getItems';
import { configure, getLogger } from "log4js";
import { DbSetting, LogSetting } from './config';
import { getThumbnail } from './api/getThumbnsil';
import { getContents } from './getContents';
import { getEvents } from './getEvents';
import proxy from 'express-http-proxy';
import http from 'http';
import { cleanupContentValuesForRegist, getDatasourceIdOfTheDataId, getDatasourceRecord, getItemWkt } from './util/utility';
import { geocoder, getGeocoderFeature } from './api/geocoder';
import { getCategory } from './api/getCategory';
import { getSnsPreview } from './api/getSnsPreview';
import cors from 'cors';
import { exit } from 'process';
import { getMapInfoById } from './getMapDefine';
import { UserAuthInfo, getUserAuthInfoInTheMap, getUserIdByRequest } from './auth/getMapUser';
import { getMapPageInfo } from './getMapInfo';
import { getMapList } from './api/getMapList';
import { search } from './api/search';
import { Auth0Management } from './auth/Auth0Management';
import { OriginalAuthManagement } from './auth/OriginalAuthManagement';
import { NoneAuthManagement } from './auth/NoneAuthManagement';
import { CurrentMap, sleep } from '../279map-backend-common/src';
import { BroadcastItemParam, OdbaGetImageUrlAPI, OdbaGetLinkableContentsAPI, OdbaGetUnpointDataAPI, OdbaLinkContentToItemAPI, OdbaRegistDataAPI, OdbaRemoveDataAPI, OdbaUnlinkContentAPI, OdbaUpdateContentAPI, OdbaUpdateDataAPI, callOdbaApi } from '../279map-backend-common/src/api';
import SessionManager from './session/SessionManager';
import { geojsonToWKT } from '@terraformer/wkt';
import { getItem, getItemsById } from './api/getItem';
import { loadSchemaSync } from '@graphql-tools/load';
import { join } from 'path';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { IFieldResolverOptions } from '@graphql-tools/utils';
import { Auth, ConnectErrorType, ConnectInfo, ContentsDefine, MapDefine, MapPageOptions, MutationChangeAuthLevelArgs, MutationConnectArgs, MutationLinkContentArgs, MutationRegistDataArgs, MutationRemoveDataArgs, MutationRequestArgs, MutationSwitchMapKindArgs, MutationUnlinkContentArgs, MutationUpdateContentArgs, MutationUpdateDataArgs, Operation, ParentOfContent, QueryGeocoderArgs, QueryGetCategoryArgs, QueryGetContentArgs, QueryGetContentsArgs, QueryGetContentsInItemArgs, QueryGetEventArgs, QueryGetGeocoderFeatureArgs, QueryGetImageArgs, QueryGetImageUrlArgs, QueryGetItemsArgs, QueryGetItemsByIdArgs, QueryGetSnsPreviewArgs, QueryGetThumbArgs, QueryGetUnpointContentsArgs, QuerySearchArgs, Subscription } from './graphql/__generated__/types';
import { MResolvers, MutationResolverReturnType, QResolvers, QueryResolverReturnType, Resolvers } from './graphql/type_utility';
import { authDefine } from './graphql/auth_define';
import { GeoPropertiesScalarType, GeocoderIdInfoScalarType, IconKeyScalarType, JsonScalarType } from './graphql/custom_scalar';
import { makeExecutableSchema } from '@graphql-tools/schema'
import { CustomError } from './graphql/CustomError';
import { getLinkedItemIdList } from './api/apiUtility';
import SessionInfo from './session/SessionInfo';
import { Geometry } from 'geojson';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import MyPubSub, { SubscriptionArgs } from './graphql/MyPubSub';
import { DataId, MapKind } from './types-common/common-types';
import { AuthMethod, ItemDefineWithoudContents } from './types';
import { getImage } from './api/getImage';
import { getOriginalIconDefine } from './api/getOriginalIconDefine';

type GraphQlContextType = {
    request: express.Request,
    userId?: string;

    // コネクション確立時にのみ設定される値
    session: SessionInfo;
    sessionKey: string; // SID or Token
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

const authenticateErrorProcess = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // 認証エラー
    apiLogger.warn('connect error', err, req.headers.authorization);
    if (err.name === 'Unauthenticated') {
        res.status(401).send({
            type: ConnectErrorType.Unauthorized,
            detail: err.message,
        });
    } else if (err.name === 'Bad Request') {
        res.status(400).send({
            type: ConnectErrorType.IllegalError,
            detail: err.message,
        });
    } else {
        res.status(403).send({
            type: ConnectErrorType.Forbidden,
            detail: err.message + err.stack,
        });
    }
};

/**
 * セッション状態をチェックする。
 * @returns セッションキー、接続中の地図情報
 * @throws セッション接続できていない場合
 */
const sessionCheckFunc = async(req: Request) => {
    const sessionKey = req.headers.sessionid;
    if (!sessionKey || typeof sessionKey !== 'string') {
        throw new CustomError({
            type: ConnectErrorType.IllegalError,
            message: 'no sessionid in headers',
        })
    }
    apiLogger.info('[start]', req.url, sessionKey);

    const session = sessionManager.get(sessionKey);
    if (!session) {
        throw new CustomError({
            type: ConnectErrorType.SessionTimeout,
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

const checkGraphQlAuthLv = async(operationName: string, userAuthInfo: UserAuthInfo) => {
    if (!(operationName in authDefine)) {
        throw new CustomError({
            type: ConnectErrorType.IllegalError,
            message: 'illegal operationName: ' + operationName,
        })
    }
    const needAuthLv = authDefine[operationName as Resolvers];
    let allowAuthList: Auth[];
    switch(needAuthLv) {
        case Auth.None:
            allowAuthList = [Auth.None, Auth.View, Auth.Edit, Auth.Admin];
            break;
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
            type: ConnectErrorType.NoAuthenticate,
            message: 'user does not have authentication.'
        })
    }
    return userAuthLv;
}

const fileSchema = loadSchemaSync(
    [
        join(__dirname, './graphql/types.gql'),
        join(__dirname, './graphql/query.gql'),
        join(__dirname, './graphql/mutation.gql'),
        join(__dirname, './graphql/subscription.gql'),
    ],
    {
        loaders: [new GraphQLFileLoader()],
    }
);

const pubsub = new MyPubSub();
// The root provides a resolver function for each API endpoint
type QueryResolverFunc = (parent: any, param: any, ctx: GraphQlContextType) => QueryResolverReturnType<any>;
type QueryResolver = Record<QResolvers, QueryResolverFunc>
type MutationResolverFunc<T extends MResolvers> = (parent: any, param: any, ctx: GraphQlContextType) => MutationResolverReturnType<T>;
type MutationResolver = Record<MResolvers, MutationResolverFunc<MResolvers>>;

const schema = makeExecutableSchema<GraphQlContextType>({
    typeDefs: fileSchema,
    resolvers: {
        Query: {
            /**
             * システム共通定義を返す
             */
            config: async(): QueryResolverReturnType<'config'> => {
                if (authMethod === AuthMethod.Auth0) {
                    return {
                        domain: process.env.AUTH0_DOMAIN ?? '',
                        clientId: process.env.AUTH0_FRONTEND_CLIENT_ID ?? '',
                        audience: process.env.AUTH0_AUDIENCE ?? '',
                    }
                } else {
                    return {
                        dummy: true,
                    }
                }
            },
            /**
             * ログインユーザーがアクセス可能な地図一覧を返す。
             * ログインしていないユーザーの場合は、Public地図のみ返す
             */
            getMapList: async(_, param, ctx): QueryResolverReturnType<'getMapList'> => {
                apiLogger.info('[start] getmaplist');
                try {
                    const userId = ctx.userId;
                    if (userId) {
                        await authManagementClient.getUserMapList(userId);
                    }
                    const list = await getMapList(ctx.request);
            
                    return list;
    
                } catch(e) {
                    logger.warn('getmaplist error', e, ctx.request.headers.authorization);
                    throw e;
                }
        
            },
            /**
             * 地図アイテム取得
             */
            getItems: async(parent: any, param: QueryGetItemsArgs, ctx): Promise<ItemDefineWithoudContents[]> => {
                try {
                    const items = await getItems({
                        param,
                        currentMap: ctx.currentMap,
                    });
        
                    // apiLogger.debug('result', result);
        
                    return items;
        
                } catch(e) {
                    apiLogger.warn('get-items API error', param, e);
                    throw e;
                }
            },
            /**
             * 地図アイテム取得(ID指定)
             */
            getItemsById: async(_, param: QueryGetItemsByIdArgs, ctx): Promise<ItemDefineWithoudContents[]> => {
                try {
                    const result = await getItemsById(param);

                    return result;

                } catch(e) {
                    apiLogger.warn('get-items-by-id API error', param, e);
                    throw e;
                }
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
                    apiLogger.warn('getContents error', param, e);
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
            getUnpointContents: async(_: any, param: QueryGetUnpointContentsArgs, ctx): QueryResolverReturnType<'getUnpointContents'> => {
                try {
                    // call ODBA
                    const result = await callOdbaApi(OdbaGetUnpointDataAPI, {
                        currentMap: ctx.currentMap,
                        dataSourceId: param.datasourceId,
                        nextToken: param.nextToken ?? undefined,
                        keyword: param.keyword ?? undefined,
                    });
            
                    return result;

                } catch(e) {
                    apiLogger.warn('get-unpointdata API error', param, e);
                    throw e;
                }
            },
            /**
             * 指定のコンテンツのサムネイル画像取得
             * 複数の画像が紐づく場合は、代表１つを取得して返す
             */
            getThumb: async(_, param: QueryGetThumbArgs, ctx): QueryResolverReturnType<'getThumb'> => {
                try {
                    return await getThumbnail(param.contentId);

                } catch(e) {
                    apiLogger.warn('get-thumb error', param.contentId, e);
                    throw e;
                }

            },
            getImage: async(_, param: QueryGetImageArgs, ctx): QueryResolverReturnType<'getImage'> => {
                try {
                    return await getImage(param.imageId, param.size, ctx.currentMap);

                } catch(e) {
                    apiLogger.warn('get-image error', param.imageId, e);
                    throw e;
                }
            },
            /**
             * オリジナル画像URL取得
             */
            getImageUrl: async(_, param: QueryGetImageUrlArgs, ctx): QueryResolverReturnType<'getImageUrl'> => {
                try {
                    // call odba
                    const result = await callOdbaApi(OdbaGetImageUrlAPI, {
                        currentMap: ctx.currentMap,
                        id: param.contentId,
                    });
                    return result ?? '';

                } catch(e) {
                    apiLogger.warn('get-imageurl API error', param, e);
                    throw e;
                }
            },
            /**
             * 検索
             */
            search: async(_, param: QuerySearchArgs, ctx): QueryResolverReturnType<'search'> => {
                try {
                    const result = await search(ctx.currentMap, param)
                    return result;

                } catch(e) {
                    apiLogger.warn('search API error', param, e);
                    throw e;
                }
            },
            /**
             * 住所検索
             */
            geocoder: async(_, param: QueryGeocoderArgs): QueryResolverReturnType<'geocoder'> => {

                try {
                    const result = await geocoder(param);
                    return result.map(res => {
                        return {
                            idInfo: res.idInfo,
                            name: res.name,
                            geometry: res.geometry as Geometry,
                        }
                    });
            
                } catch(e) {
                    apiLogger.warn('geocoder API error', param, e);
                    throw e;
                }

            },
            /**
             * 住所検索結果Feature取得
             */
            getGeocoderFeature: async(_, param: QueryGetGeocoderFeatureArgs): QueryResolverReturnType<'getGeocoderFeature'> => {
                try {
                    const result = await getGeocoderFeature(param);
                    return result;

                } catch(e) {
                    apiLogger.warn('get-geocoder-feature API error', param, e);
                    throw e;
                }

            },
            /**
             * SNSプレビュー取得
             */
            getSnsPreview: async(_, param: QueryGetSnsPreviewArgs): QueryResolverReturnType<'getSnsPreview'> => {

                try {
                    const result = await getSnsPreview(param);
                    return result;

                } catch(e) {
                    apiLogger.warn('get-sns-preview API error', param, e);
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
             * 接続確立
             */
            connect: async(_, param: MutationConnectArgs, ctx): MutationResolverReturnType<'connect'> => {
                apiLogger.info('[start] connect');

                try {
                    const mapInfo = await getMapInfoById(param.mapId);
                    if (mapInfo === null) {
                        throw new CustomError({
                            type: ConnectErrorType.UndefinedMap,
                            message: 'mapId is not found : ' + param.mapId,
                        });
                    }

                    const userAccessInfo = await getUserAuthInfoInTheMap(mapInfo, ctx.request, true);
                    if (userAccessInfo.authLv === undefined && userAccessInfo.guestAuthLv === Auth.None) {
                        // ログインが必要な地図の場合
                        throw new CustomError({
                            type: ConnectErrorType.Unauthorized,
                            message: 'need login',
                        });
                    }

                    if (userAccessInfo.authLv === Auth.None && userAccessInfo.guestAuthLv === Auth.None) {
                        // 権限なしエラーを返却
                        throw new CustomError({
                            type: ConnectErrorType.NoAuthenticate,
                            message: 'this user does not have authentication' + userAccessInfo.userId,
                            userId: userAccessInfo.userId,
                        })
                    }
                    if (userAccessInfo.authLv === Auth.Request && userAccessInfo.guestAuthLv === Auth.None) {
                        // 承認待ちエラーを返却
                        throw new CustomError({
                            type: ConnectErrorType.Requesting,
                            message: 'requesting',
                            userId: userAccessInfo.userId,
                        })
                    }

                    const session = sessionManager.createSession({
                        mapId: mapInfo.map_page_id,
                        mapKind: mapInfo.default_map,
                    });
                
                    // オリジナルアイコン定義を取得
                    const originalIcons = await getOriginalIconDefine(param.mapId);

                    const mapDefine: MapDefine = {
                        name: mapInfo.title,
                        useMaps: mapInfo.use_maps.split(',').map(mapKindStr => {
                            return mapKindStr as MapKind;
                        }),
                        defaultMapKind: mapInfo.default_map as MapKind,
                        options: mapInfo.options as MapPageOptions,
                        originalIcons,
                    };

                    const connect: ConnectInfo = 
                        (userAccessInfo.authLv === undefined || userAccessInfo.authLv === Auth.None || userAccessInfo.authLv === Auth.Request)
                        ? {
                            sid: session.sid,
                            authLv: userAccessInfo.guestAuthLv,
                        }
                        : {
                            sid: session.sid,
                            authLv: userAccessInfo.authLv,
                            userId: userAccessInfo.userId,
                            userName: 'userName' in userAccessInfo ? userAccessInfo.userName : '',
                        };

                    return {
                        mapDefine,
                        connect,
                    }
                
                } catch(e) {
                    apiLogger.warn('connect error', e, ctx.request.headers.authorization);
                    throw e;

                }

            },
            /**
             * 切断
             */
            disconnect: async(_, param, ctx): MutationResolverReturnType<'disconnect'> => {
                sessionManager.delete(ctx.sessionKey);
                return true;
            },
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

                    // apiLogger.debug('result', JSON.stringify(result,undefined,4));

                    return result;

                } catch(e) {    
                    apiLogger.warn('switchMapKind error', e);
                    throw e;
                }
            },
            /**
             * データ登録
             */
            registData: async(_, param: MutationRegistDataArgs, ctx): MutationResolverReturnType<'registData'> => {
                try {
                    // call ODBA
                    const id = await callOdbaApi(OdbaRegistDataAPI, {
                        currentMap: ctx.currentMap,
                        dataSourceId: param.datasourceId,
                        item: param.item ?? undefined,
                        contents: param.contents ?? undefined,
                        linkItems: param.linkItems ?? undefined,
                    });

                    // 更新通知
                    if (param.item) {
                        const wkt = geojsonToWKT(param.item.geometry);
                        pubsub.publish('itemInsert', ctx.currentMap, [
                            {
                                id,
                                datasourceId: param.datasourceId,
                                wkt,
                            }
                        ])
                    }
                    if (param.linkItems) {
                        for (const itemId of param.linkItems) {
                            const item = await getItem(itemId);
                            const wkt = await getItemWkt(itemId);
                            if (wkt) {
                                pubsub.publish('itemUpdate',
                                    ctx.currentMap, 
                                    [ { id: itemId, datasourceId: item?.datasourceId ?? '', wkt } ]
                                );
                            }
                        }

                    }

                    return id;

                } catch(e) {    
                    apiLogger.warn('regist-data API error', param, e);
                    throw e;
                }
            },
            /**
             * データ更新
             */
            updateData: async(_, param: MutationUpdateDataArgs, ctx): MutationResolverReturnType<'updateData'> => {
                try {
                    // call ODBA
                    const result = await callOdbaApi(OdbaUpdateDataAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        item: param.item ?? undefined,
                        contents: param.contents ?? undefined,
                    })
                    if (!result) {
                        throw new Error('failed');
                    }

                    // 更新通知
                    if (param.item) {
                        const item = await getItem(param.id);
                        const beforeWkt = await getItemWkt(param.id);
                        const afterWkt = param.item.geometry ? geojsonToWKT(param.item.geometry) : undefined;
                        pubsub.publish('itemUpdate', ctx.currentMap, [
                            {
                                id: param.id,
                                datasourceId: item?.datasourceId ?? '',
                                wkt: afterWkt ?? beforeWkt ?? 'POLYGON ((-1 1, -1 -1, 1 -1, 1 1))',    // undefinedになることはないはずだが、エラーを防ぐために仮設定
                            }
                        ]);
                    }

                    return true;

                } catch(e) {    
                    apiLogger.warn('update-item API error', param, e);
                    throw e;
                }
            },

            /**
             * データ削除
             */
            removeData: async(_, param: MutationRemoveDataArgs, ctx): MutationResolverReturnType<'removeData'> => {
                try {
                    // 紐づいているdataを取得
                    const linkedDatas = await getLinkedItemIdList(param.id);
                    await callOdbaApi(OdbaRemoveDataAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                    });

                    // 更新通知
                    pubsub.publish('itemDelete', ctx.currentMap, [param.id]);
                    // 削除したデータと紐づいていたものについて、itemUpdate通知を送る
                    for (const data of linkedDatas) {
                        const wkt = await getItemWkt(data.itemId);

                        if (wkt) {
                            pubsub.publish('itemUpdate', 
                                { mapId: data.mapId, mapKind: data.mapKind },
                                [ {　datasourceId: data.itemDatasourceId, id: data.itemId, wkt } ],
                            )
                        }
                    }

                    return true;

                } catch(e) {
                    apiLogger.warn('remove-data API error', param, e);
                    throw e;
                }
            },

            /**
             * コンテンツ更新
             */
            updateContent: async(_, param: MutationUpdateContentArgs, ctx): MutationResolverReturnType<'updateContent'> => {
                try {
                    // 誤った値が含まれないように処置
                    const dataSourceId = await getDatasourceIdOfTheDataId(param.id);
                    const values = await cleanupContentValuesForRegist(ctx.currentMap.mapId, dataSourceId, param.values);

                    // call ODBA
                    await callOdbaApi(OdbaUpdateContentAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        values,
                    });
            
                    // 更新通知
                    // -- コンテンツ更新通知
                    pubsub.publish('contentUpdate', {
                        contentId: param.id,
                    }, Operation.Update);

                    // -- 当該コンテンツを子孫に持つアイテムIDを取得して通知
                    const itemIdList = await getLinkedItemIdList(param.id);

                    for (const item of itemIdList) {
                        const wkt = await getItemWkt(item.itemId);
                        if (wkt) {
                            pubsub.publish('itemUpdate', 
                                { mapId: item.mapId, mapKind: item.mapKind },
                                [ { id: item.itemId, datasourceId: '', wkt } ]
                            );
                        }
                    }

                    // const ds = await getDatasourceRecord(param.id.dataSourceId);
                    // if (ds.location_kind === DatasourceLocationKindType.RealPointContent) {
                    //     // - RealPointContentの場合
                    //     const wkt = await getItemWkt(param.id);
                    //     if (wkt) {
                    //         pubsub.publish('itemUpdate', ctx.currentMap, [ { id: param.id, wkt }]);
                    //     }
                    // } else {
                    //     // - 当該コンテンツを子孫に持つアイテムIDを取得
                    //     // const itemId = await getAncestorItemId(param.id);
                    //     // if (itemId) {
                    //     //     pubsub.publish('childContentsUpdate', { itemId }, true);
                    //     // }
                    // }
                
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
                        const item = await getItem(id);
                        const wkt = await getItemWkt(id);
                        if (!wkt) {
                            logger.warn('not found extent', id);
                        } else {
                            pubsub.publish('itemUpdate', ctx.currentMap, [ { id, datasourceId: item?.datasourceId ?? '', wkt } ]);
                        }
                    }

                    return true;
            
                } catch(e) {
                    apiLogger.warn('link-content2item API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツ紐づけ解除
             */
            unlinkContent: async(parent: any, param: MutationUnlinkContentArgs, ctx): MutationResolverReturnType<'unlinkContent'> => {
                try {
                    // アイテムと一体になったコンテンツは紐づけ解除不可
                    const dataSourceId = await getDatasourceIdOfTheDataId(param.id);
                    const datasource = await getDatasourceRecord(dataSourceId);
                    // if (param.id.id === param.parent.id.id && param.id.dataSourceId === param.parent.id.dataSourceId) {
                    //     throw new Error('this content can not unlink with the item because this is same record.');
                    // }

                    // TODO: 親がコンテンツの場合の考慮（ODBA側のインタフェース対応後）
                    // call ODBA
                    await callOdbaApi(OdbaUnlinkContentAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        parent: {
                            type: 'item',
                            itemId: param.parent.id,
                        }
                    });
            
                    // 更新通知
                    if (param.parent.type === ParentOfContent.Item) {
                        const id = param.parent.id;
                        const item = await getItem(id);
                        const wkt = await getItemWkt(id);
                        if (!wkt) {
                            logger.warn('not found extent', id);
                        } else {
                            // pubsub.publish('childContentsUpdate', { itemId: id }, true);
                            pubsub.publish('itemUpdate', ctx.currentMap, [ { id, datasourceId: item?.datasourceId ?? '', wkt } ]);
                        }
                    }

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
                    pubsub.publish('userListUpdate', { mapId }, true);
                    pubsub.publish('updateUserAuth', { userId: param.userId, mapId }, true);
        
                    return true;

                } catch(e) {
                    apiLogger.warn('change-auth-level API error', param, e);
                    throw e;
                }
            },
            /**
             * 地図へのユーザ登録申請
             */
            request: async(_, param: MutationRequestArgs, ctx): MutationResolverReturnType<'request'> => {
                try {
                    apiLogger.info('[start] request', param);

                    const queryMapId = param.mapId;
                    const mapInfo = await getMapInfoById(queryMapId);
                    if (mapInfo === null) {
                        throw new CustomError({
                            type: ConnectErrorType.UndefinedMap,
                            message: 'mapId is not found : ' + queryMapId,
                        })
                    }

                    const userId = getUserIdByRequest(ctx.request);
                    if (!userId) {
                        throw new Error('userId undefined');
                    }
                    await authManagementClient.requestForEnterMap({
                        userId,
                        mapId: mapInfo.map_page_id,
                        name: param.name,
                        newUserAuthLevel: (mapInfo.options as MapPageOptions)?.newUserAuthLevel ?? Auth.None,
                    });

                    // publish
                    pubsub.publish('userListUpdate', { mapId: queryMapId }, true);
                    pubsub.publish('updateUserAuth', { userId, mapId: queryMapId }, true);

                    return true;

                } catch(e) {
                    apiLogger.warn('request error', e);
                    throw e;

                } finally {
                    apiLogger.info('[end] request');

                }


            },
        } as MutationResolver,
        Subscription: {
            itemInsert: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'itemInsert'>) => {
                    return pubsub.asyncIterator('itemInsert', args);
                }
            },
            itemUpdate: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'itemUpdate'>) => {
                    return pubsub.asyncIterator('itemUpdate', args);
                }
            },
            itemDelete: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'itemDelete'>) => {
                    return pubsub.asyncIterator('itemDelete', args);
                }
            },
            // childContentsUpdate: {
            //     resolve: (payload) => payload,
            //     subscribe: (_, args: SubscriptionArgs<'childContentsUpdate'>) => {
            //         return pubsub.asyncIterator('childContentsUpdate', args);
            //     }
            // },
            contentUpdate: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'contentUpdate'>) => {
                    return pubsub.asyncIterator('contentUpdate', args);
                }
            },
            updateUserAuth: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'updateUserAuth'>) => {
                    return pubsub.asyncIterator('updateUserAuth', args);
                }
            },
            userListUpdate: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'userListUpdate'>) => {
                    return pubsub.asyncIterator('userListUpdate', args);
                }
            },
            mapInfoUpdate: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'mapInfoUpdate'>) => {
                    return pubsub.asyncIterator('mapInfoUpdate', args);
                }
            },
            error: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'error'>) => {
                    return pubsub.asyncIterator('error', args);
                }
            }
        }as Record<keyof Subscription, IFieldResolverOptions<any, GraphQlContextType, any>>,
        ItemDefine: {
            contents: async(parent: ItemDefineWithoudContents, _, ctx): Promise<ContentsDefine[]> => {
                const result = await getContents({
                    param: [{
                        itemId: parent.id,
                    }],
                    currentMap: ctx.currentMap,
                    authLv: ctx.authLv,
                });

                // 値を持つコンテンツのみを返す（コンテンツ）
                return result.filter(c => c.hasValue);
            }
        },
        // DataId: DataIdScalarType,
        JSON: JsonScalarType,
        IconKey: IconKeyScalarType,
        GeoProperties: GeoPropertiesScalarType,
        GeocoderIdInfo: GeocoderIdInfoScalarType,
        ServerConfig: {
            __resolveType: (obj: any) => {
                if ('domain' in obj && 'clientId' in obj && 'audience' in obj) {
                    return 'Auth0Config';
                } else {
                    return 'NoneConfig';
                }
            }
        },
    }
})

app.use(
    "/graphql",
    authManagementClient.checkJwt,
    authenticateErrorProcess,
);

const apolloServer = new ApolloServer({
    schema,
    context: async(ctx) => {
        const req = ctx.req as Request;
        const operationName = ctx.req.body.operationName;
        apiLogger.debug('operationName', operationName);
        if (!operationName || ['IntrospectionQuery'].includes(operationName) || authDefine[operationName as Resolvers] === Auth.None) {
            const userId = getUserIdByRequest(req);
            // @ts-ignore セッション関連情報は存在しないので
            return {
                request: req,
                userId,
                authLv: Auth.None,
            }
        }

        const { sessionKey, session } = await sessionCheckFunc(req);
        const mapPageInfo = await getMapPageInfo(session.currentMap.mapId);
        if (!mapPageInfo) {
            throw new CustomError({
                type: ConnectErrorType.UndefinedMap,
                message: 'map not found'
            })
        }

        const userAuthInfo = await getUserAuthInfoInTheMap(mapPageInfo, req);
        if (!req.headers.authorization) {
            // 未ログインの場合は、ゲストユーザ権限があるか確認
            if (!userAuthInfo) {
                throw new CustomError({
                    type: ConnectErrorType.Unauthorized,
                    message: 'Unauthenticated.this map is private, please login.',
                })
            }        
        }

        const authLv = await checkGraphQlAuthLv(operationName, userAuthInfo);
        return {
            sessionKey,
            session,
            userId: userAuthInfo.userId,
            currentMap: session.currentMap,
            authLv,
            request: req,    
        }

    }
});

apolloServer.start().then(() => {
    apolloServer.applyMiddleware({
        // @ts-ignore
        app,
        path: '/graphql',
    });

    // Subscriptionサーバー
    new SubscriptionServer(
        { execute, subscribe, schema },
        {
            server,
            path: '/graphql',
        }
    )

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
            // TODO:
            // if (cur.dataSourceId in acc) {
            //     acc[cur.dataSourceId].push(cur);
            // } else {
            //     acc[cur.dataSourceId] = [cur];
            // }
            return acc;
        }, {} as {[datasourceId: string]: DataId[]});
        const targets = [] as {id: DataId; datasourceId: string; wkt: string}[];
        for (const entry of Object.entries(itemIdListByDataSource)) {
            const itemIdList = entry[1];
            for (const itemId of itemIdList) {
                const wkt = await getItemWkt(itemId);
                if (wkt) {
                    targets.push({
                        id: itemId,
                        datasourceId: entry[0],
                        wkt,
                    })
                }
            }
        }
        switch(param.operation) {
            case 'insert':
                pubsub.publish('itemInsert', {
                    mapId: param.mapId,
                    mapKind: MapKind.Real,
                }, targets);
                pubsub.publish('itemInsert', {
                    mapId: param.mapId,
                    mapKind: MapKind.Virtual,
                }, targets);
                break;
            case 'update':
                pubsub.publish('itemUpdate', {
                    mapId: param.mapId,
                    mapKind: MapKind.Real,
                }, targets);
                pubsub.publish('itemUpdate', {
                    mapId: param.mapId,
                    mapKind: MapKind.Virtual,
                }, targets);
                break;
            case 'delete':
                pubsub.publish('itemDelete', {
                    mapId: param.mapId,
                    mapKind: MapKind.Real,
                }, param.itemIdList);
                pubsub.publish('itemDelete', {
                    mapId: param.mapId,
                    mapKind: MapKind.Virtual,
                }, param.itemIdList);
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



})
