import { ServerInfo } from '../types/types';
import { cacheExchange, createClient, fetchExchange, subscriptionExchange } from "urql";
import { ConfigDocument, GetMapListDocument, GetMapMetaInfoDocument } from "../graphql/generated/graphql";
import { SubscriptionClient } from 'subscriptions-transport-ws';


export function createGqlClient(serverInfo: ServerInfo, sessionid?: string) {
    const protocol = serverInfo.ssl ? 'https' : 'http';
    const url = `${protocol}://${serverInfo.host}/graphql`;

    const wsProtocol = serverInfo.ssl ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${serverInfo.host}/graphql`;
    const subscriptionClient = new SubscriptionClient(wsUrl, { reconnect: true });

    const client = createClient({
        url,
        exchanges: [
            cacheExchange, 
            fetchExchange, 
            subscriptionExchange({
                forwardSubscription: request => subscriptionClient.request(request),
            })
        ],
        fetchOptions: () => {
            return {
                headers: {
                    Authorization:  serverInfo.token ? `Bearer ${serverInfo.token}` : '',
                    sessionid: sessionid ?? '',
                },
            }
        },
    })
    return client;
}

/**
 * ユーザがアクセス可能な地図一覧を返す
 * @param host 
 * @returns 
 */
export async function getAccessableMapList({ host, ssl, token }: ServerInfo) {
    const mapServer = {
        host,
        ssl,
        token,
    } as ServerInfo;
    const gqlClient = createGqlClient(mapServer);

    try {
        const result = await gqlClient.query(GetMapListDocument, {});
        return result.data?.getMapList.map(item => ({
            mapId: item.mapId,
            authLv: item.authLv,
            name: item.name,
            description: item.description ?? undefined,
            thumbnail: item.thumbnail ?? undefined,
        }));

    } catch(e) {
        console.warn('get accessable maplist failed.', e);
        throw new Error('get accessable maplist failed.', { cause: e});
    }

}

/**
 * 指定の地図のメタ情報を返す。
 * ユーザがアクセスできるものに限定する
 * @param param0 
 */
export async function getMapMetaInfo({ host, ssl, token }: ServerInfo, mapId: string) {
    const mapServer = {
        host,
        ssl,
        token,
    } as ServerInfo;
    const gqlClient = createGqlClient(mapServer);

    try {
        const result = await gqlClient.query(GetMapMetaInfoDocument, { mapId });
        
        if (!result.data) {
            throw new Error('get metainfo failed', result.error)
        }

        const data = result.data.getMapMetaInfo;
        return {
            title: data.title,
            description: data.description ?? undefined,
            keyword: data.keyword ?? undefined,
            image: data.image ?? undefined,
        }

    } catch(e) {
        console.warn('get map metainfo failed.', e);
        throw new Error('get map metainfo failed.', { cause: e});
    }
}

/**
 * サーバーの認証方式について呼び出し元に返すための関数
 * @param host 
 * @returns 
 */
export async function getAuthConfig(host: string, ssl: boolean) {
    const mapServer = {
        host,
        ssl,
    } as ServerInfo;
    const gqlClient = createGqlClient(mapServer);
    try {
        const result = await gqlClient.query(ConfigDocument, {});
        return result.data?.config

    } catch(e) {
        console.warn('get server config failed.', e);
        return {};
        // throw new Error('get server config failed.', { cause: e});
    }
}