import { useContext, useCallback, useMemo } from 'react';
import { OlMapWrapper } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { getAPICallerInstance } from '../../api/ApiCaller';
import { atom, useAtom } from 'jotai';
import { useAtomCallback, atomWithReducer } from 'jotai/utils';
import { instanceIdAtom } from '../../store/session';

type Device = 'pc' | 'sp';
const instansMap = new Map<string, OlMapWrapper>();

// OlMapWrapperの生成回数。再生成した時にgetMap参照しているクラスで再レンダリングを走らせるために用いている。
const mapInstanceCntReducerAtom = atomWithReducer(0, (prev) => {
    return prev + 1;
});
const mapIdAtom = atom((get) => {
    const instanceId = get(instanceIdAtom);
    const cnt = get(mapInstanceCntReducerAtom);
    return instanceId + cnt;
})

/**
 * mapインスタンス、apiインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const [_, dispatch] = useAtom(mapInstanceCntReducerAtom);

    /**
     * 地図インスタンスを生成する
     * @param target 地図を配置するDivElement
     * @param デバイス種別
     * @returns 地図インスタンス
     */
    const createMapInstance = useAtomCallback(
        useCallback((get, set, target: HTMLDivElement, device: Device) => {
            dispatch();
            const mapId = get(mapIdAtom);
            const map = new OlMapWrapper(mapId, target, device);
            console.log('create map', mapId);

            instansMap.set(mapId, map);
            return map;
        }, [dispatch])
    );

    const destroyMapInstance = useAtomCallback(
        useCallback((get) => {
            const mapId = get(mapIdAtom);
            const map = instansMap.get(mapId);
            if (!map) return;
            console.log('destroy map', mapId);

            map.dispose();
            instansMap.delete(mapId);
        }, [])
    )

    const getMap = useAtomCallback(
        useCallback((get) => {
            const mapId = get(mapIdAtom);
            console.log('debug getMap', mapId);
            return instansMap.get(mapId);
        }, [])
    )

    const [mapId] = useAtom(mapIdAtom);
    const map = useMemo(() => {
        console.log('debug map', mapId);
        return instansMap.get(mapId);
    }, [mapId]);

    const { mapInstanceId } = useContext(OwnerContext);
    const getApi = useCallback(() => {
        return getAPICallerInstance(mapInstanceId);
    }, [mapInstanceId])

    return {
        getApi,
        getMap,
        map,
        createMapInstance,
        destroyMapInstance,
    }
}