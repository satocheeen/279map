import { useMemo, useContext } from 'react';
import { getMapInstance } from '../TsunaguMap/OlMapWrapper';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';

/**
 * MapChart配下のコンポーネントに対してmapインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const { mapInstanceId } = useContext(OwnerContext);

    const map = useMemo(() => {
        const map = getMapInstance(mapInstanceId);
        console.log('map update', mapInstanceId, map);
        return map;
    }, [mapInstanceId]);

    return {
        map,
    }
}