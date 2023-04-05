import { APIDefine } from '../279map-common';
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
            const url = `https://${this._serverInfo.domain}/api/${api.uri}`;
            const res = await fetch(url, {
                method: api.method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:  param?.token ? `Bearer ${param.token}` : '',
                    sessionid: this._sid ?? '',
                },
                body: param ? JSON.stringify(param) : undefined,
            });
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