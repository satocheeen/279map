import { useRef, useContext } from 'react';
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
    const mapRef = useRef<OlMapType|undefined>(getMapInstance(mapInstanceId));
    const apiRef = useRef<ApiCallerType>(getAPICallerInstance(mapInstanceId));

    useWatch(() => {
        mapRef.current = getMapInstance(mapInstanceId);
        apiRef.current = getAPICallerInstance(mapInstanceId);

        return () => {
            mapRef.current = undefined;
        }
    }, [mapInstanceId]);

    return {
        map: mapRef.current,
        api: apiRef.current,
    }
}