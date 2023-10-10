import { Grib2Define, ItemDefine } from '279map-common';
import { atom } from 'jotai';

export type LoadedItemKey = {
    datasourceId: string;
    zoom?: number;
}

export type LoadedAreaInfo = {
    geometry: GeoJSON.Geometry;
}
type LoadedItemMap = {[datasourceId: string]: LoadedAreaInfo};
export const loadedItemMapAtom = atom<LoadedItemMap>({});

export type ItemsMap = {[itemId: string]: ItemDefine};
type ItemsByDatasourceMap = {[dsId: string]: ItemsMap};
export const allItemsAtom = atom({} as ItemsByDatasourceMap);

export type Grib2Map = {[datasourceId: string]: Grib2Define[]};
export const allGrib2MapAtom = atom<Grib2Map>({});
type Range = {
    min: number;
    max: number;
}
export const gribRangeMapAtom = atom((get) => {
    const allGrib2Map = get(allGrib2MapAtom);
    const map = {} as {[datasourceId: string]: Range};
    Object.entries(allGrib2Map).forEach(([datasourceId, define]) => {
        // TODO: 時間考慮
        const range = define[0].grids.reduce((acc, cur) => {
            if (!acc) {
                return {
                    min: cur.value,
                    max: cur.value,
                }
            }
            const min = Math.min(acc.min, cur.value);
            const max = Math.max(acc.max, cur.value);
            return {
                min,
                max
            }

        }, undefined as undefined | Range);
        if (range)
            map[datasourceId] = range;
    })
    return map;
})
