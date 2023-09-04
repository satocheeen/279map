import { ItemDefine, Extent } from '279map-common';
import { atom } from 'jotai';

export type ItemsMap = {[id: string]: ItemDefine};

export type LoadedItemKey = {
    datasourceId: string;
    extent: Extent;
    zoom?: number;
}
export const loadedItemKeysAtom = atom<LoadedItemKey[]>([]);

type ItemsByDatasourceMap = {[dsId: string]: ItemsMap};
export const allItemsAtom = atom({} as ItemsByDatasourceMap);
