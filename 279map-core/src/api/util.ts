import { ConfigAPI, GetMapListAPI } from "tsunagumap-api";
import { ServerInfo } from '../types/types';
import { ServerConfig } from "279map-common";
import { createAPICallerInstance } from "./ApiCaller";

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
    const apiCaller = createAPICallerInstance('no-instance', mapServer, () => {});
    try {
        const result = await apiCaller.callApi(GetMapListAPI, undefined);
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
    const apiCaller = createAPICallerInstance('no-instance', mapServer, () => {});
    try {
        const result = await apiCaller.callApi(ConfigAPI, undefined) as ServerConfig;
        return result;

    } catch(e) {
        console.warn('get server config failed.', e);
        throw new Error('get server config failed.', { cause: e});
    }
}