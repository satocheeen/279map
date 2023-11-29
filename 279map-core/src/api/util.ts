import { GetMapListAPI } from "tsunagumap-api";
import { ServerInfo } from '../types/types';
import { callApi } from "./api";
import { cacheExchange, createClient, fetchExchange } from "urql";
import { ConfigDocument } from "../graphql/generated/graphql";

function createGqlClient(serverInfo: ServerInfo) {
    const protocol = serverInfo.ssl ? 'https' : 'http';
    const url = `${protocol}://${serverInfo.host}/graphql`;
    const client = createClient({
        url,
        exchanges: [cacheExchange, fetchExchange],
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

    try {
        const result = await callApi(mapServer, undefined, GetMapListAPI, undefined);
        return result;

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
        throw new Error('get server config failed.', { cause: e});
    }
}