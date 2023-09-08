import { ItemDefine } from '279map-common';
import { atom } from 'jotai';

export type LoadedItemKey = {
    datasourceId: string;
    zoom?: number;
}
// keyはLoadedItemKeyをstringifyしたもの
export type ItemsMap = {[key: string]: ItemDefine};

export type LoadedAreaInfo = {
    geometry: GeoJSON.Geometry;
}
type LoadedItemMap = {[datasourceId: string]: LoadedAreaInfo};
export const loadedItemMapAtom = atom<LoadedItemMap>({});

type ItemsByDatasourceMap = {[dsId: string]: ItemsMap};
export const allItemsAtom = atom({} as ItemsByDatasourceMap);
