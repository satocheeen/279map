import { APIDefine } from '279map-common';
import { ServerInfo } from '../types/types';
import { ApiError, ErrorType } from 'tsunagumap-api';

type ErrorCallback = (errorType: ApiError) => void;
class ApiCaller {
    _serverInfo: ServerInfo;
    _sid?: string;   // 特定地図とのセッション確立後
    _sessionFailureCallback: ErrorCallback;    // リロードが必要なエラーが発生した場合のコールバック

    constructor(serverInfo: ServerInfo,  sessionFailureCallback: ErrorCallback) {
        this._serverInfo = serverInfo;
        this._sessionFailureCallback = sessionFailureCallback;
    }

    setSID(sid: string) {
        this._sid = sid;
    }

    async callApi<API extends APIDefine<any, any>> (api: API, param: API['param']): Promise<API['result']> {
        try {
            const protocol = this._serverInfo.ssl ? 'https' : 'http';
            const url = `${protocol}://${this._serverInfo.domain}/api/${api.uri}`;
            const headers = {
                'Content-Type': 'application/json',
                Authorization:  this._serverInfo.token ? `Bearer ${this._serverInfo.token}` : '',
                sessionid: this._sid ?? '',
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
                switch(error.type) {
                    case ErrorType.UndefinedMap:
                    case ErrorType.Unauthorized:
                    case ErrorType.Forbidden:
                    case ErrorType.SessionTimeout:
                        // 継続不可能なエラーの場合
                        this._sessionFailureCallback(error);
                    //     return;
                    default:
                        throw new Error(error.type + ' ' + (error.detail ?? ''));
                }
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
            console.warn('connecting server failed.', e);
            throw e;
        }
    }
}

let _instance: ApiCaller | undefined = undefined;
// TODO: 地図idを受け取ってinstance管理するようにする
export function createAPICallerInstance(serverInfo: ServerInfo, errorCallback: ErrorCallback) {
    _instance = new ApiCaller(serverInfo, errorCallback);
    return _instance;
}

// TODO: 引数に地図ID
export function getAPICallerInstance() {
    if (!_instance) {
        throw new Error('api not initialized');
    }
    return _instance;
}