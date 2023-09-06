import { ApiError, ConfigAPI, ConnectAPI, ErrorType, GetMapListAPI, RequestAPI } from "tsunagumap-api";
import { ServerInfo } from '../types/types';
import { APIDefine } from "279map-common";

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

export async function callApi<API extends APIDefine<any, any>>(serverInfo: ServerInfo, sid: string | undefined, api: API, param: API['param']): Promise<API['result']> {
    try {
        if (!sid) {
            if (api !== ConnectAPI && api !== GetMapListAPI && api !== ConfigAPI && api !== RequestAPI) {
                throw 'not set SID: ' + api.uri;
            }
        }
        const protocol = serverInfo.ssl ? 'https' : 'http';
        const url = `${protocol}://${serverInfo.host}/api/${api.uri}`;
        const headers = {
            'Content-Type': 'application/json',
            Authorization:  serverInfo.token ? `Bearer ${serverInfo.token}` : '',
            sessionid: sid ?? '',
        };
        let res: Response;
        if (api.method === 'post') {
            res = await fetch(url, {
                method: api.method,
                headers,
                body: param ? JSON.stringify(param) : undefined,
            });
        } else {
            let myUrl = url;
            if (param) {
                const paramStr = Object.entries(param).map(([key, value]) => {
                    return key + '=' + value;
                }).join('&');
                myUrl += ('?' + paramStr);
            }
            res = await fetch(myUrl, {
                method: api.method,
                headers,
            });
        }
        if (!res.ok) {
            const error: ApiError = await res.json();
            throw new ApiException(error);
        }
        if (api.resultType === 'blob') {
            const result = await res.blob();
            return result;
        } else if (api.resultType === 'string') {
            const result = await res.text();
            return result;
        }
        const result = await res.text();

        if (result.length === 0) {
            return;
        } else {
            try {
                const json =JSON.parse(result) as API['result'];
                return json;
            } catch(e) {
                return result;
            }
        }

    } catch (e) {
        console.warn('callApi failed.', api.uri, e);
        throw e;
    }

}
