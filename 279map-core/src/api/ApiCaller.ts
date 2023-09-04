import { APIDefine, ContentsDefine } from '279map-common';
import { ServerInfo } from '../types/types';
import { ApiError, ConfigAPI, ConnectAPI, ConnectResult, ErrorType, GetContentsAPI, GetContentsParam, GetMapListAPI } from 'tsunagumap-api';
import { getMapKey } from '../util/dataUtility';
import { ApiException } from './util';
import { RequestAPI } from 'tsunagumap-api';

export type ErrorCallback = (errorType: ApiError) => void;
export class ApiCaller {
    readonly _id: string;    // インスタンスID
    readonly _serverInfo: ServerInfo;
    _sid?: string;   // セッションID。特定地図とのセッション確立後にサーバーから返される値。
    _sessionFailureCallback: ErrorCallback;    // リロードが必要なエラーが発生した場合のコールバック

    constructor(id: string, serverInfo: ServerInfo,  sessionFailureCallback: ErrorCallback) {
        this._id = id;
        this._serverInfo = serverInfo;
        this._sessionFailureCallback = sessionFailureCallback;
    }

    async callApi<API extends APIDefine<any, any>> (api: API, param: API['param']): Promise<API['result']> {
        try {
            if (!this._sid) {
                if (api !== ConnectAPI && api !== GetMapListAPI && api !== ConfigAPI && api !== RequestAPI) {
                    throw 'not set SID: ' + api.uri;
                }
            }
            const protocol = this._serverInfo.ssl ? 'https' : 'http';
            const url = `${protocol}://${this._serverInfo.host}/api/${api.uri}`;
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
                    default:
                        throw new ApiException(error);
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
            console.warn('callApi failed.', this._id, e);
            throw e;
        }
    }

    async connect(mapId: string): Promise<ConnectResult> {
        const res = await this.callApi(ConnectAPI, { mapId });
        this._sid = res.sid;
        return res;
    }

    async getContents(param: GetContentsParam): Promise<ContentsDefine[]> {
        try {
            // 重複する内容は除去する
            const itemIdSet = new Set<string>();
            const contentIdSet = new Set<string>();
            const fixedParam = param.filter(item => {
                if ('itemId' in item) {
                    if (itemIdSet.has(getMapKey(item.itemId))) {
                        return false;
                    } else {
                        itemIdSet.add(getMapKey(item.itemId));
                        return true;
                    }
                } else {
                    if (contentIdSet.has(getMapKey(item.contentId))) {
                        return false;
                    } else {
                        contentIdSet.add(getMapKey(item.contentId));
                        return true;
                    }
                }
            });
            if (fixedParam.length === 0) {
                return [];
            }
            const apiResult = await this.callApi(GetContentsAPI, fixedParam);
    
            return apiResult.contents;
    
        } catch (e) {
            console.warn('getContents error', e);
            throw new Error('getContents failed.');
        }
    
    }
}
export type ApiCallerType = InstanceType<typeof ApiCaller>;
