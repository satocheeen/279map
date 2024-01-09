import express, { NextFunction, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getMapInfo } from './getMapInfo';
import { getItems } from './getItems';
import { configure, getLogger } from "log4js";
import { DbSetting, LogSetting } from './config';
import { getThumbnail } from './getThumbnsil';
import { getContents } from './getContents';
import { getEvents } from './getEvents';
import proxy from 'express-http-proxy';
import http from 'http';
import { getItemWkt } from './util/utility';
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
import { CurrentMap, getImageBase64, sleep } from '../279map-backend-common/src';
import { BroadcastItemParam, OdbaGetImageUrlAPI, OdbaGetLinkableContentsAPI, OdbaGetUnpointDataAPI, OdbaLinkContentDatasourceToMapAPI, OdbaLinkContentToItemAPI, OdbaRegistContentAPI, OdbaRegistItemAPI, OdbaRemoveContentAPI, OdbaRemoveItemAPI, OdbaUnlinkContentDatasourceFromMapAPI, OdbaUpdateContentAPI, OdbaUpdateItemAPI, callOdbaApi } from '../279map-backend-common/src/api';
import SessionManager from './session/SessionManager';
import { geojsonToWKT } from '@terraformer/wkt';
import { getItem, getItemsById } from './api/getItem';
import { loadSchemaSync } from '@graphql-tools/load';
import { join } from 'path';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { IFieldResolverOptions } from '@graphql-tools/utils';
import { Auth, ConnectInfo, DatasourceConfig, DatasourceKindType, ErrorType, MapDefine, MapKind, MapPageOptions, MutationChangeAuthLevelArgs, MutationConnectArgs, MutationLinkContentArgs, MutationLinkContentsDatasourceArgs, MutationRegistContentArgs, MutationRegistItemArgs, MutationRemoveContentArgs, MutationRemoveItemArgs, MutationRequestArgs, MutationSwitchMapKindArgs, MutationUnlinkContentArgs, MutationUnlinkContentsDatasourceArgs, MutationUpdateContentArgs, MutationUpdateItemArgs, ParentOfContent, QueryGeocoderArgs, QueryGetCategoryArgs, QueryGetContentArgs, QueryGetContentsArgs, QueryGetContentsInItemArgs, QueryGetEventArgs, QueryGetGeocoderFeatureArgs, QueryGetImageUrlArgs, QueryGetItemsArgs, QueryGetItemsByIdArgs, QueryGetSnsPreviewArgs, QueryGetThumbArgs, QueryGetUnpointContentsArgs, QuerySearchArgs, Subscription, ThumbSize } from './graphql/__generated__/types';
import { MResolvers, MutationResolverReturnType, QResolvers, QueryResolverReturnType, Resolvers } from './graphql/type_utility';
import { authDefine } from './graphql/auth_define';
import { DataIdScalarType, GeoPropertiesScalarType, GeocoderIdInfoScalarType, IconKeyScalarType, JsonScalarType } from './graphql/custom_scalar';
import { makeExecutableSchema } from '@graphql-tools/schema'
import { CustomError } from './graphql/CustomError';
import { getLinkedItemIdList } from './api/apiUtility';
import SessionInfo from './session/SessionInfo';
import { Geometry } from 'geojson';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import MyPubSub, { SubscriptionArgs } from './graphql/MyPubSub';
import { DataId } from './types-common/common-types';
import { AuthMethod } from './types';

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
            type: ErrorType.Unauthorized,
            detail: err.message,
        });
    } else if (err.name === 'Bad Request') {
        res.status(400).send({
            type: ErrorType.IllegalError,
            detail: err.message,
        });
    } else {
        res.status(403).send({
            type: ErrorType.Forbidden,
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
            type: ErrorType.NoAuthenticate,
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
                    const list = await getMapList(userId);
            
                    return list;
    
                } catch(e) {
                    logger.warn('getmaplist error', e, ctx.request.headers.authorization);
                    throw e;
                }
        
            },
            /**
             * 地図アイテム取得
             */
            getItems: async(parent: any, param: QueryGetItemsArgs, ctx): QueryResolverReturnType<'getItems'> => {
                try {
                    const items = await getItems({
                        param,
                        currentMap: ctx.currentMap,
                    });
        
                    // 仮登録中の情報を付与して返す
                    ctx.session.addTemporaryItems(items, ctx.currentMap);
        
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
            getItemsById: async(_, param: QueryGetItemsByIdArgs, ctx): QueryResolverReturnType<'getItemsById'> => {
                try {
                    const result = await getItemsById(param);

                    // 仮登録中の情報を付与して返す
                    ctx.session.mergeTemporaryItems(result, ctx.currentMap, param.targets);

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
             * サムネイル画像取得
             */
            getThumb: async(_, param: QueryGetThumbArgs): QueryResolverReturnType<'getThumb'> => {

                try {
                    if (param.size === ThumbSize.Medium) {
                        // オリジナル画像を縮小する
                        const url = await callOdbaApi(OdbaGetImageUrlAPI, {
                            id: param.contentId,
                        });
                        if (!url) {
                            throw new Error('original image url not found');
                        }
                        const image = await getImageBase64(url, {
                             size: { width: 500, height: 500},
                             fit: 'cover',
                        });

                        return image.base64;

                    } else {
                        const result = await getThumbnail(param.contentId);
            
                        return result;
                    }

                } catch(e) {
                    apiLogger.warn('get-thumb error', param.contentId, e);
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
                            geoJson: res.geoJson as Geometry,
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
                            type: ErrorType.UndefinedMap,
                            message: 'mapId is not found : ' + param.mapId,
                        });
                    }

                    const userAccessInfo = await getUserAuthInfoInTheMap(mapInfo, ctx.request, true);
                    if (userAccessInfo.authLv === undefined && userAccessInfo.guestAuthLv === Auth.None) {
                        // ログインが必要な地図の場合
                        throw new CustomError({
                            type: ErrorType.Unauthorized,
                            message: 'need login',
                        });
                    }

                    if (userAccessInfo.authLv === Auth.None && userAccessInfo.guestAuthLv === Auth.None) {
                        // 権限なしエラーを返却
                        throw new CustomError({
                            type: ErrorType.NoAuthenticate,
                            message: 'this user does not have authentication' + userAccessInfo.userId,
                            userId: userAccessInfo.userId,
                        })
                    }
                    if (userAccessInfo.authLv === Auth.Request && userAccessInfo.guestAuthLv === Auth.None) {
                        // 承認待ちエラーを返却
                        throw new CustomError({
                            type: ErrorType.Requesting,
                            message: 'requesting',
                            userId: userAccessInfo.userId,
                        })
                    }

                    const session = sessionManager.createSession({
                        mapId: mapInfo.map_page_id,
                        mapKind: mapInfo.default_map,
                    });
                
                    const mapDefine: MapDefine = {
                        name: mapInfo.title,
                        useMaps: mapInfo.use_maps.split(',').map(mapKindStr => {
                            return mapKindStr as MapKind;
                        }),
                        defaultMapKind: mapInfo.default_map as MapKind,
                        options: mapInfo.options as MapPageOptions,
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
                    apiLogger.warn(e);
                    throw e;
                }
            },
            /**
             * 位置アイテム登録
             */
            registItem: async(_, param: MutationRegistItemArgs, ctx): MutationResolverReturnType<'registItem'> => {
                try {
                    // メモリに仮登録
                    const session = ctx.session;
                    const tempID = session.addTemporaryRegistItem(ctx.currentMap, param);
                
                    const wkt = geojsonToWKT(param.geometry);
                    // call ODBA
                    callOdbaApi(OdbaRegistItemAPI, {
                        currentMap: ctx.currentMap,
                        dataSourceId: param.datasourceId,
                        name: param.name ?? undefined,
                        geometry: param.geometry,
                        geoProperties: param.geoProperties,
                    }).then(async(id) => {
                        // 更新通知
                        pubsub.publish('itemInsert', ctx.currentMap, [
                            {
                                id,
                                wkt,
                            }
                        ])
                    }).catch(e => {
                        apiLogger.warn('callOdba-registItem error', e);
                        // TODO: フロントエンドにエラーメッセージ表示

                        // メモリから除去
                        session.removeTemporaryItem(tempID);
                        // 仮アイテム削除通知
                        pubsub.publish('itemDelete', ctx.currentMap, [
                            {
                                id: tempID,
                                dataSourceId: param.datasourceId,
                            }                            
                        ])
                    }).finally(() => {
                        // メモリから除去
                        session.removeTemporaryItem(tempID);

                        // 仮アイテム削除通知
                        pubsub.publish('itemDelete', ctx.currentMap, [
                            {
                                id: tempID,
                                dataSourceId: param.datasourceId,
                            }
                        ])
                    })

                    // 仮アイテム描画させるための通知
                    pubsub.publish('itemInsert', ctx.currentMap, [
                        {
                            id: {
                                id: tempID,
                                dataSourceId: param.datasourceId,
                            },
                            wkt,
                        }
                    ])

                    return true;

                } catch(e) {    
                    apiLogger.warn('regist-item API error', param, e);
                    throw e;
                }

            },
            /**
             * 位置アイテム更新
             */
            updateItem: async(_, param: MutationUpdateItemArgs, ctx): MutationResolverReturnType<'updateItem'> => {
                try {
                    const session = ctx.session;
                    // メモリに仮登録
                    const targets = await Promise.all(param.targets.map(async(target) => {
                        const currentItem = await getItem(target.id);
                        if (!currentItem) {
                            throw new Error('item not found: ' + target.id);
                        }
                        const tempID = session.addTemporaryUpdateItem(ctx.currentMap, currentItem, target);

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
                    pubsub.publish('itemUpdate', ctx.currentMap, 
                        targets.map(t => {
                            return {
                                id: t.target.id,
                                wkt: t.wkt,
                            }
                        })
                    );

                    for (const target of targets) {
                        // call ODBA
                        callOdbaApi(OdbaUpdateItemAPI, {
                            currentMap: ctx.currentMap,
                            id: target.target.id,
                            geometry: target.target.geometry ?? undefined,
                            geoProperties: target.target.geoProperties ?? undefined,
                            name: target.target.name ?? undefined,
                        })
                        .catch(e => {
                            apiLogger.warn('callOdba-updateItem error', e);
                            // TODO: フロントエンドにエラーメッセージ表示
                        }).finally(() => {
                            // メモリから除去
                            session.removeTemporaryItem(target.tempID);

                            // 更新通知
                            pubsub.publish('itemUpdate', ctx.currentMap, [
                                {
                                    id: target.target.id,
                                    wkt: target.wkt,
                                }
                            ])
                        })
                    }
                
                    return true;

                } catch(e) {    
                    apiLogger.warn('update-item API error', param, e);
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
                    pubsub.publish('itemDelete', ctx.currentMap, [param.id]);
                    
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
                            pubsub.publish('childContentsUpdate', { itemId: id }, true);
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

                    pubsub.publish('childContentsUpdate', { itemId: target.itemId }, true);
                
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
                            pubsub.publish('childContentsUpdate', { itemId: id }, true);

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
                            pubsub.publish('childContentsUpdate', { itemId: id }, true);

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
                            pubsub.publish('childContentsUpdate', { itemId: item.itemId }, true);

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
                            type: ErrorType.UndefinedMap,
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

                    pubsub.publish('mapInfoUpdate', { mapId: ctx.currentMap.mapId }, true);

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

                    pubsub.publish('mapInfoUpdate', { mapId: ctx.currentMap.mapId }, true);

                    return true;

                } catch(e) {
                    apiLogger.warn('unlink-contents-from-map API error', e);
                    throw e;
                }
            },
        } as MutationResolver,
        Subscription: {
            test: {
                resolve: (payload) => payload,
                subscribe: (_, args) =>  {
                    return pubsub.asyncIterator('test', {});
                }
            },
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
            childContentsUpdate: {
                resolve: (payload) => payload,
                subscribe: (_, args: SubscriptionArgs<'childContentsUpdate'>) => {
                    return pubsub.asyncIterator('childContentsUpdate', args);
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
            }
        }as Record<keyof Subscription, IFieldResolverOptions<any, GraphQlContextType, any>>,
        DataId: DataIdScalarType,
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
        DatasourceConfig: {
            __resolveType: (obj: DatasourceConfig) => {
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
        },
        VisibleDataSource: {
            __resolveType: (obj: any) => {
                if ('dataSourceId' in obj) {
                    return 'VisibleDataSourceDatasource';
                } else {
                    return 'VisibleDataSourceGroup';
                }
            }
        }
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
                type: ErrorType.UndefinedMap,
                message: 'map not found'
            })
        }

        const userAuthInfo = await getUserAuthInfoInTheMap(mapPageInfo, req);
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
