import { useRef, useState, useContext, useCallback } from 'react';
import { OlMapType, getMapInstance } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { ApiCallerType, getAPICallerInstance } from '../../api/ApiCaller';
import { useWatch } from '../../util/useWatch';

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