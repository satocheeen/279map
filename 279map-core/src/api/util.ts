import { ServerInfo } from '../types/types';
import { cacheExchange, createClient, fetchExchange, subscriptionExchange } from "urql";
import { ConfigDocument, GetMapListDocument } from "../graphql/generated/graphql";
import { SubscriptionClient } from 'subscriptions-transport-ws';


export function createGqlClient(serverInfo: ServerInfo, sessionid?: string) {
    const protocol = serverInfo.ssl ? 'https' : 'http';
    const url = `${protocol}://${serverInfo.host}/graphql`;

    const wsProtocol = serverInfo.ssl ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${serverInfo.host}/graphql`;
    console.log('wsUrl', wsUrl);
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
export async function getAccessableMapList(host: string, ssl: boolean, token: string | undefined) {
    const mapServer = {
        host: host,
        ssl,
        token,
    } as ServerInfo;
    const gqlClient = createGqlClient(mapServer);

    try {
        const result = await gqlClient.query(GetMapListDocument, {});
        return result.data?.getMapList;

    } catch(e) {
        console.warn('get accessable maplist failed.', e);
        throw new Error('get accessable maplist failed.', { cause: e});
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