import { useCallback, useMemo } from 'react';
import { ApiCaller, ApiCallerType, ErrorCallback } from './ApiCaller';
import { ServerInfo } from '../entry';
import { useAtomCallback } from 'jotai/utils';
import { instanceIdAtom } from '../store/session';
import { useAtom } from 'jotai';

/**
 * インスタンス管理マップ
 * ※複数の地図コンポーネントが１画面上に配置されるケースに対応するため、Mapで管理している
 */
const instansMap = new Map<string, ApiCaller>();

export function createAPICallerInstance(id: string, serverInfo: ServerInfo,  errorCallback: ErrorCallback) {
    const instance = new ApiCaller(id, serverInfo, errorCallback);
    console.log('createAPI', id);
    instansMap.set(id, instance);
}

export function destroyAPICallerInstance(id: string) {
    const api = instansMap.get(id);
    if (!api) return;
    console.log('destroyAPI', id);
    instansMap.delete(id);
}

// コンポーネント外（jotai等）からAPIを用いる場合向け
export function getAPICallerInstance(id: string) {
    const instance = instansMap.get(id);        
    if (!instance) {
        throw new Error('no api :' + id);
    }
    return instance;
}
export function useApi() {

    const callApi: ApiCallerType['callApi'] = useAtomCallback(
        useCallback((get, set, ...args) => {
            const apiId = get(instanceIdAtom);
            const api = instansMap.get(apiId);
            if (!api) {
                console.warn('api undefined');
                throw 'api undefined';
            }
            return api.callApi(...args);
        }, [])
    )

    const [apiId] = useAtom(instanceIdAtom);
    const hasToken = useMemo(() => {
        const api = instansMap.get(apiId);
        return api?._serverInfo.token !== undefined;
    }, [apiId]);

    return {
        callApi,
        hasToken,
    }
}