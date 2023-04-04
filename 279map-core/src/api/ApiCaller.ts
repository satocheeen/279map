import { APIDefine } from '../279map-common';
import { ServerInfo } from '../types/types';

class ApiCaller {
    _serverInfo: ServerInfo;
    _sid?: string;   // 特定地図とのセッション確立後

    constructor(serverInfo: ServerInfo) {
        this._serverInfo = serverInfo;
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
                const errorMessage = await res.text();
                throw new Error(errorMessage);
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
export function createAPICallerInstance(serverInfo: ServerInfo) {
    _instance = new ApiCaller(serverInfo);
    return _instance;
}

// TODO: 引数に地図ID
export function getAPICallerInstance() {
    if (!_instance) {
        throw new Error('api not initialized');
    }
    return _instance;
}