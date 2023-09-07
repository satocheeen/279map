import { ItemDefine } from '279map-common';
import { Position } from 'geojson';
import { atom } from 'jotai';

export type ItemsMap = {[id: string]: ItemDefine};

export type LoadedItemInfo = {
    datasourceId: string;
    polygon: {
        type: 'Polygon';
        coordinates: Position[][]
    } | {
        type: 'MultiPolygon';
        coordinates: Position[][][]
    };
    zoom?: number;
}
type LoadedItemMap = {[datasourceId: string]: LoadedItemInfo};
export const loadedItemMapAtom = atom<LoadedItemMap>({});

type ItemsByDatasourceMap = {[dsId: string]: ItemsMap};
export const allItemsAtom = atom({} as ItemsByDatasourceMap);
