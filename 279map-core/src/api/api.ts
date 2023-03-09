import { APIDefine } from '../279map-common';
import { ServerInfo } from '../types/types';

export function getServerUrl(server: ServerInfo) {
    const protocol = 'https';
    return `${protocol}://${server.domain}`;
}

/**
 * call API (called from redux)
 * API呼び出し（reduxから呼ぶ際に使用する）
 */
export async function callApi<API extends APIDefine<any, any>> (server: ServerInfo, api: API, param: API['param']): Promise<API['result']> {
    let response: Response | undefined;
    try {
        const serverUrl = getServerUrl(server);
        response = await accessServer({
            url: `${serverUrl}/api/${api.uri}`,
            method: api.method,
            token: server.token,
            param,
        });

    } catch (e) {
        console.warn('connecting server failed.', e);
        throw e;
    }
    const result = await response.text();
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
}

/**
 * 指定のURLに接続して結果を返す。
 * 接続失敗時は数度リトライする。
 * @param url 
 */
 async function accessServer(param: {url: string; method?: 'get' | 'post'; token?: string; param?: {}}): Promise<Response> {
    let response: Response | undefined;

    const func = () => new Promise<Response>((resolve, reject) => {
        fetch(param.url, {
            method: param.method,
            headers: {
                'Content-Type': 'application/json',
                Authorization:  param.token ? `Bearer ${param.token}` : '',
            },
            body: param.param ? JSON.stringify(param.param) : undefined,
            credentials: param.token ? undefined : 'include',
        })
        .then((res) => {
            if (!res.ok) {
                res.text().then((text) => {
                    reject(text);
                });
            } else {
                resolve(res);
            }
        })
        .catch((e) => {
            console.warn('connecting server failed.', e);
            reject(e);
        })
    });

    const sleep = (sec: number) => new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, sec * 1000);
    });

    response = await func();
    // let cnt = 0;
    // do {
    //     try {
    //         response = await func();

    //     } catch(e) {
    //         // 接続エラー時は少し置く
    //         await sleep(3);
    //     }
    //     cnt++;

    //     if (cnt > 1) {
    //         throw new Error('サーバー接続に失敗しました。サーバーがダウンしている可能性があります。');
    //     }
    // } while (response === undefined);

    return response;
}

