import { ConfigAPI, ErrorType, GetMapListAPI } from "tsunagumap-api";
import { ServerInfo } from '../types/types';
import { ServerConfig } from "279map-common";
import { createAPICallerInstance } from "./ApiCaller";

export enum MyErrorType {
    NonInitialize = "NonInitialize"
}
export type MyError = {
    type: ErrorType | MyErrorType;
    detail?: string;
    userId?: string;
}
export class ApiException extends Error {
    apiError: MyError;

    constructor(error: MyError) {
        super();
        this.apiError = error;
        this.message = `ApiError: ${error.type} ${error.detail ?? ''}`;
    }
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