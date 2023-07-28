import { useContext, useCallback } from 'react';
import { getMapInstance } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { getAPICallerInstance } from '../../api/ApiCaller';

/**
 * MapWrapper配下のコンポーネントに対してmapインスタンス、apiインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const { mapInstanceId } = useContext(OwnerContext);

    const getMap = useCallback(() => {
        return getMapInstance(mapInstanceId);
    }, [mapInstanceId])

    const getApi = useCallback(() => {
        return getAPICallerInstance(mapInstanceId);
    }, [mapInstanceId])

    return {
        getApi,
        getMap,
    }
}