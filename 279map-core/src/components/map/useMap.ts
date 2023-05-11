import { useMemo, useContext } from 'react';
import { MapChartContext } from "../TsunaguMap/MapChart";
import { getMapInstance } from '../TsunaguMap/OlMapWrapper';

/**
 * MapChart配下のコンポーネントに対してmapインスタンスを渡すためのフック
 * @returns 
 */
export function useMap() {
    const { instanceId } = useContext(MapChartContext);

    const map = useMemo(() => {
        const map = getMapInstance(instanceId);
        console.log('map update', instanceId, map);
        return map;
    }, [instanceId]);

    return {
        map,
    }
}