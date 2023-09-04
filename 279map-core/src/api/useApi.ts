import { useContext, useCallback, useMemo } from 'react';
import { OwnerContext } from '../components/TsunaguMap/TsunaguMap';
import { ApiCaller, ApiCallerType, ErrorCallback } from './ApiCaller';
import { ServerInfo } from '../entry';
import { atomWithReducer, useAtomCallback } from 'jotai/utils';
import { instanceIdAtom, mapServerAtom } from '../store/session';
import { atom, useAtom } from 'jotai';

const instansMap = new Map<string, ApiCaller>();

// instance生成回数。再生成した時にapi参照しているコンポーネントで再レンダリングを走らせるために用いている。
const apiInstanceCntReducerAtom = atomWithReducer(0, (prev) => {
    return prev + 1;
});
export const apiIdAtom = atom((get) => {
    const instanceId = get(instanceIdAtom);
    const cnt = get(apiInstanceCntReducerAtom);
    return instanceId + cnt;
})

// コンポーネント外（jotai等）からAPIを用いる場合向け
export function getAPICallerInstance(id: string) {
    const instance = instansMap.get(id);        
    if (!instance) {
        throw new Error('no api :' + id);
    }
    return instance;
}

export function useApi() {
    const { mapInstanceId } = useContext(OwnerContext);
    const [_, dispatch] = useAtom(apiInstanceCntReducerAtom);
    
    const createAPI = useAtomCallback(
        useCallback((get, set, errorCallback: ErrorCallback) => {
            dispatch();
            const apiId = get(apiIdAtom);
            const serverInfo = get(mapServerAtom); 
            if (!serverInfo) {
                throw new Error('mapServerAtom undefined');
            }
            const instance = new ApiCaller(apiId, serverInfo, errorCallback);

            console.log('create api', apiId);
            instansMap.set(apiId, instance);
            return instance;
        }, [])
    )
    
    const destroyAPI = useAtomCallback(
        useCallback((get) => {
            const apiId = get(apiIdAtom);
            const api = instansMap.get(apiId);
            if (!api) return;
            console.log('destroy api', apiId);
            instansMap.delete(apiId);
        }, [])
    )

    const [apiId] = useAtom(apiIdAtom);
    const api = useMemo(() => {
        return instansMap.get(apiId);        
    }, [apiId])

    const callApi: ApiCallerType['callApi'] = useAtomCallback(
        useCallback((get, set, ...args) => {
            const apiId = get(apiIdAtom);
            const api = instansMap.get(apiId);
            if (!api) {
                console.warn('api undefined');
                throw 'api undefined';
            }
            return api.callApi(...args);
        }, [])
    )

    return {
        createAPI,
        destroyAPI,
        callApi,
    }
}