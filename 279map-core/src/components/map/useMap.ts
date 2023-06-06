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
    const apiRef = useRef<ApiCallerType>(getAPICallerInstance(mapInstanceId));

    useWatch(() => {
        apiRef.current = getAPICallerInstance(mapInstanceId);

    }, [mapInstanceId]);

    const getMap = useCallback(() => {
        return getMapInstance(mapInstanceId);
    }, [mapInstanceId])

    return {
        api: apiRef.current,
        getMap,
    }
}