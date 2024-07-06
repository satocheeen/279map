import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { getItems } from './getItems';
import { configure, getLogger } from "log4js";
import { DbSetting, LogSetting } from './config';
import { getThumbnail } from './api/getThumbnsil';
import { getEvents } from './getEvents';
import proxy from 'express-http-proxy';
import http from 'http';
import { geocoder, getGeocoderFeature } from './api/geocoder';
import { getCategory } from './api/getCategory';
import cors from 'cors';
import { exit } from 'process';
import { getMapInfoById, getMapInfoByIdWithAuth } from './getMapDefine';
import { UserAuthInfo, getUserAuthInfoInTheMap, getUserIdByRequest } from './auth/getMapUser';
import { getMapPageInfo } from './getMapInfo';
import { getMapList } from './api/getMapList';
import { search } from './api/search';
import { Auth0Management } from './auth/Auth0Management';
import { OriginalAuthManagement } from './auth/OriginalAuthManagement';
import { NoneAuthManagement } from './auth/NoneAuthManagement';
import { CurrentMap, sleep } from '../279map-backend-common/src';
import { BroadcastItemParam, OdbaGetImageUrlAPI, OdbaGetLinkableContentsAPI, OdbaGetUncachedDataAPI, OdbaLinkDataAPI, OdbaRegistDataAPI, OdbaRemoveDataAPI, OdbaUnlinkDataAPI, OdbaUpdateDataAPI, callOdbaApi } from '../279map-backend-common/src/api';
import SessionManager from './session/SessionManager';
import { getItemsById } from './api/getItem';
import { loadSchemaSync } from '@graphql-tools/load';
import { join } from 'path';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { IFieldResolverOptions } from '@graphql-tools/utils';
import { Auth, ConnectErrorType, ConnectInfo, ContentsDefine, MapDefine, MapPageOptions, MutationChangeAuthLevelArgs, MutationConnectArgs, MutationLinkDataArgs, MutationLinkDataByOriginalIdArgs, MutationRegistDataArgs, MutationRemoveDataArgs, MutationRequestArgs, MutationSwitchMapKindArgs, MutationUnlinkDataArgs, MutationUpdateDataArgs, MutationUpdateDataByOriginalIdArgs, Operation, QueryGeocoderArgs, QueryGetCategoryArgs, QueryGetContentArgs, QueryGetEventArgs, QueryGetGeocoderFeatureArgs, QueryGetImageArgs, QueryGetImageUrlArgs, QueryGetItemsArgs, QueryGetItemsByIdArgs, QueryGetThumbArgs, QueryGetUnpointContentsArgs, QuerySearchArgs, Subscription, Target } from './graphql/__generated__/types';
import { MResolvers, MutationResolverReturnType, QResolvers, QueryResolverReturnType, Resolvers } from './graphql/type_utility';
import { authDefine } from './graphql/auth_define';
import { GeoPropertiesScalarType, GeocoderIdInfoScalarType, IconKeyScalarType, JsonScalarType } from './graphql/custom_scalar';
import { makeExecutableSchema } from '@graphql-tools/schema'
import { CustomError } from './graphql/CustomError';
import { getLinkedDataIdList } from './api/apiUtility';
import SessionInfo from './session/SessionInfo';
import { Geometry } from 'geojson';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import MyPubSub, { SubscriptionArgs } from './graphql/MyPubSub';
import { MapKind } from './types-common/common-types';
import { AuthMethod, ItemDefineWithoutContents } from './types';
import { getImage } from './api/getImage';
import { getOriginalIconDefine } from './api/getOriginalIconDefine';
import { getLinkedContent } from './api/get-content/getLinkedContents';
import { getContent } from './api/get-content/getContent';
import { publishData } from './util/publish_utility';
import { getUnpointData } from './api/getUnpointData';

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
// let releaseNum = 0;
// ConnectionPool.on('release', () => {
//     logger.debug('release', ++releaseNum);
// });
// let arquireNum = 0;
// ConnectionPool.on('acquire', () => {
//     logger.debug('acquire', ++arquireNum);
// });
// let enqueueNum = 0;
// ConnectionPool.on('enqueue', () => {
//     logger.debug('enqueue', ++enqueueNum);
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
            getMapMetaInfo: async(_, param, ctx): QueryResolverReturnType<'getMapMetaInfo'> => {
                apiLogger.info('[start] getMapMetaInfo');

                try {
                    const { mapInfo } = await getMapInfoByIdWithAuth(param.mapId, ctx.request);
                    return {
                        mapId: param.mapId,
                        title: mapInfo.title,
                        description: mapInfo.description,
                        image: mapInfo.thumbnail,
                    }
    
                } catch(e) {
                    logger.warn('getMapMetaInfo error', e, ctx.request.headers.authorization);
                    throw e;
                }
            },
            /**
             * 地図アイテム取得
             */
            getItems: async(parent: any, param: QueryGetItemsArgs, ctx): Promise<ItemDefineWithoutContents[]> => {
                try {
                    apiLogger.info('[start] getItems');
                    const items = await getItems({
                        param,
                        currentMap: ctx.currentMap,
                    });
        
                    // apiLogger.debug('result', result);
        
                    return items;
        
                } catch(e) {
                    apiLogger.warn('get-items API error', param, e);
                    throw e;
                } finally {
                    apiLogger.info('[end] getItems');

                }
            },
            /**
             * 地図アイテム取得(ID指定)
             */
            getItemsById: async(_, param: QueryGetItemsByIdArgs, ctx): Promise<ItemDefineWithoutContents[]> => {
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
                    const result = await getContent({
                        dataId: param.id,
                        currentMap: ctx.currentMap,
                    });
                    if (!result) {
                        throw new Error('not find content');
                    }
                    return result;

                } catch(e) {    
                    apiLogger.warn('getContent error', param, e);
                    throw e;
                }
            },
            getUnpointContents: async(_: any, param: QueryGetUnpointContentsArgs, ctx): QueryResolverReturnType<'getUnpointContents'> => {
                try {
                    // キャッシュDBに存在するデータの中から、指定の地図上のアイテムにプロットされていないデータを取得する
                    const unpointDataList = await getUnpointData({
                        currentMap: ctx.currentMap,
                        dataSourceId: param.datasourceId,
                        keyword: param.keyword ?? undefined,
                    });
                    // ODBAに問い合わせて、キャッシュDBに未登録のデータを取得する
                    const result = await callOdbaApi(OdbaGetUncachedDataAPI, {
                        currentMap: ctx.currentMap,
                        dataSourceId: param.datasourceId,
                        nextToken: param.nextToken ?? undefined,
                        keyword: param.keyword ?? undefined,
                    });

                    return {
                        contents: [...unpointDataList, ...result.contents],
                        nextToken: result.nextToken,
                    };

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
                    const { mapInfo, userAccessInfo } = await getMapInfoByIdWithAuth(param.mapId, ctx.request);

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
                        linkItems: param.linkDatas ?? undefined,
                    });

                    // 更新通知
                    publishData(pubsub, 'insert', [id]);
                    if (param.linkDatas) {
                        publishData(pubsub, 'update', param.linkDatas);
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
                        target: {
                            type: 'dataId',
                            id: param.id,
                        },
                        item: param.deleteItem ? null : (param.item ?? undefined),
                        contents: param.contents ?? undefined,
                    })
                    if (!result) {
                        throw new Error('failed');
                    }

                    // 更新通知
                    publishData(pubsub, 'update', [param.id]);

                    return true;

                } catch(e) {    
                    apiLogger.warn('update-item API error', param, e);
                    throw e;
                }
            },

            updateDataByOriginalId: async(_, param: MutationUpdateDataByOriginalIdArgs, ctx): MutationResolverReturnType<'updateDataByOriginalId'> => {
                try {
                    // call ODBA
                    const id = await callOdbaApi(OdbaUpdateDataAPI, {
                        currentMap: ctx.currentMap,
                        target: {
                            type: 'originalId',
                            originalId: param.originalId,
                        },
                        item: param.item ?? undefined,
                        contents: param.contents ?? undefined,
                    })

                    // 更新通知
                    publishData(pubsub, 'update', [id]);

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
                    // 削除する前に紐づいているdataを取得
                    const linkedDatas = await getLinkedDataIdList(param.id);
                    await callOdbaApi(OdbaRemoveDataAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                    });

                    // 更新通知
                    pubsub.publish('dataDeleteInTheMap', ctx.currentMap, [param.id]);
                    pubsub.publish('dataUpdate', {
                        id: param.id
                    }, Operation.Delete);
                    // 削除したデータと紐づいていたものについて、itemUpdate通知を送る
                    const targets = linkedDatas.map(ld => ld.itemId);
                    publishData(pubsub, 'update', targets);

                    return true;

                } catch(e) {
                    apiLogger.warn('remove-data API error', param, e);
                    throw e;
                }
            },

            /**
             * コンテンツをアイテムに紐づけ
             */
            linkData: async(parent: any, param: MutationLinkDataArgs, ctx): MutationResolverReturnType<'linkData'> => {
                try {
                    // call ODBA
                    await callOdbaApi(OdbaLinkDataAPI, {
                        currentMap: ctx.currentMap,
                        type: 'dataId',
                        id: param.id,
                        parent: param.parent,
                    });

                    // 更新通知
                    publishData(pubsub, 'update', [param.parent]);

                    return true;
            
                } catch(e) {
                    apiLogger.warn('link-content2item API error', param, e);
                    throw e;
                }
            },

            linkDataByOriginalId: async(_, param: MutationLinkDataByOriginalIdArgs, ctx): MutationResolverReturnType<'linkDataByOriginalId'> => {
                try {
                    await callOdbaApi(OdbaLinkDataAPI, {
                        currentMap: ctx.currentMap,
                        type: 'originalId',
                        originalId: param.originalId,
                        parent: param.parent,
                    });

                    // 更新通知
                    publishData(pubsub, 'update', [param.parent]);

                    return true;

                } catch(e) {
                    apiLogger.warn('linkDataByOriginalId API error', param, e);
                    throw e;
                }
            },
            /**
             * コンテンツ紐づけ解除
             */
            unlinkData: async(parent: any, param: MutationUnlinkDataArgs, ctx): MutationResolverReturnType<'unlinkData'> => {
                try {
                    // call ODBA
                    await callOdbaApi(OdbaUnlinkDataAPI, {
                        currentMap: ctx.currentMap,
                        id: param.id,
                        parent: param.parent,
                    });
            
                    // 更新通知
                    publishData(pubsub, 'update', [param.parent]);

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
            dataInsertInTheMap: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'dataInsertInTheMap'>) => {
                    return pubsub.asyncIterator('dataInsertInTheMap', args);
                }
            },
            dataUpdateInTheMap: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'dataUpdateInTheMap'>) => {
                    return pubsub.asyncIterator('dataUpdateInTheMap', args);
                }
            },
            dataDeleteInTheMap: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'dataDeleteInTheMap'>) => {
                    return pubsub.asyncIterator('dataDeleteInTheMap', args);
                }
            },
            // childContentsUpdate: {
            //     resolve: (payload) => payload,
            //     subscribe: (_, args: SubscriptionArgs<'childContentsUpdate'>) => {
            //         return pubsub.asyncIterator('childContentsUpdate', args);
            //     }
            // },
            dataUpdate: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'dataUpdate'>) => {
                    return pubsub.asyncIterator('dataUpdate', args);
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
            content: async(parent: ItemDefineWithoutContents, _, ctx): Promise<ContentsDefine|null> => {
                try {
                    // apiLogger.info('[start] ItemDefine>content', parent.id);
                    const result = await getContent({
                        dataId: parent.id,
                        currentMap: ctx.currentMap,
                    });
                    if (!result?.hasValue) return null;
                    return result;
                } catch(e) {
                    apiLogger.warn('ItemDefine>content error', parent.id, e);
                    throw e;
                } finally {
                    // apiLogger.info('[end] ItemDefine>content', parent.id);

                }
            },
            linkedContents: async(parent: ItemDefineWithoutContents, _, ctx): Promise<ContentsDefine[]> => {
                const result = await getLinkedContent({
                    dataId: parent.id,
                    currentMap: ctx.currentMap,
                    authLv: ctx.authLv,
                });
                return result;
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

    // 静的ファイルの提供
    app.use('/static', express.static('public'));

    /**
     * SNS等のクローラー向けにメタ情報を生成して返す
     */
    app.get('*', async (req, res, next) => {
        const userAgent = req.headers['user-agent'];
        if (!userAgent) {
            next();
            return;
        }
        const isCrawler = /bot|crawler|spider|crawling/i.test(userAgent);
        if (!isCrawler) {
            next();
            return;
        }
    
        try {
            const mapId = req.path.length > 2 ? req.path.substring(1) : undefined;
            const metaInfo = await async function() {
            // og:imageは絶対URLを指定
            const imageUrl = `${req.protocol}://${req.get('host')}/static/279map.png`;
                const info = {
                    title: 'つなぐマップ',
                    description: '情報をつなげる。楽しくつなげる。',
                    image: imageUrl,
                }
                if (mapId) {
                    const { mapInfo } = await getMapInfoByIdWithAuth(mapId, req);
                    info.title = mapInfo.title;
                    if (mapInfo.description) {
                        info.description = mapInfo.description;
                    }
                    if (mapInfo.thumbnail) {
                        info.image = 'data:image/' + mapInfo.thumbnail;
                    }
                }
    
                return info;
            }();

            const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${metaInfo.title}</title>
                <meta name="description" content="${metaInfo.description}">
                <meta property="og:title" content="${metaInfo.title}">
                <meta property="og:description" content="${metaInfo.description}">
                <meta property="og:image" content="${metaInfo.image}">
            </head>
            <body>
                <div id="root">This is a page for Crawler.</div>
            </body>
            </html>
            `;
    
            res.send(html);
        } catch (error) {
            res.status(400).send('Illegal Parameters');
        }
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
        if (param.operation === 'delete') {
            pubsub.publish('dataDeleteInTheMap', 
                { mapId: param.mapId, mapKind: MapKind.Real },
                param.itemIdList,
            )
            pubsub.publish('dataDeleteInTheMap', 
                { mapId: param.mapId, mapKind: MapKind.Virtual },
                param.itemIdList,
            )
        } else {
            publishData(pubsub, param.operation, param.itemIdList);
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
