import { useEffect, useRef, useContext } from 'react';
import { OlMapType, getMapInstance } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';

/**
 * MapChart配下のコンポーネントに対してmapインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const { mapInstanceId } = useContext(OwnerContext);
    const mapRef = useRef<OlMapType|undefined>(getMapInstance(mapInstanceId));

    useEffect(() => {
        mapRef.current = getMapInstance(mapInstanceId);

        return () => {
            mapRef.current = undefined;
        }
    }, [mapInstanceId]);

    return {
        map: mapRef.current,
    }
}