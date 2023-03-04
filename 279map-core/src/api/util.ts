import { ConfigAPI } from "tsunagumap-api";
import { ServerInfo } from "../entry";
import { callApi } from "./api";

/**
 * サーバーの認証方式について呼び出し元に返すための関数
 * @param host 
 * @returns 
 */
export async function getAuthConfig(host: string) {
    const mapServer = {
        domain: host,
    } as ServerInfo;
    try {
        const result = await callApi(mapServer, ConfigAPI, undefined)
        return result;

    } catch(e) {
        console.warn('get server config failed.', e);
        throw new Error('get server config failed.', { cause: e});
    }
}