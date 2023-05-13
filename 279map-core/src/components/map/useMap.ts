import { useEffect, useRef, useContext } from 'react';
import { OlMapType, getMapInstance } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';

/**
 * MapChart配下のコンポーネントに対してmapインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const mapRef = useRef<OlMapType>();
    const { mapInstanceId } = useContext(OwnerContext);

    useEffect(() => {
        mapRef.current = getMapInstance(mapInstanceId);
    }, [mapInstanceId]);

    return {
        map: mapRef.current,
    }
}