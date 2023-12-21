import { atom } from 'jotai';
import { ItemDefine } from '../../graphql/generated/graphql';

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

/**
 * データソース単位の取得済みアイテムの最終更新日時
 */
export const latestEditedTimeOfDatasourceAtom = atom((get) => {
    const allItems = get(allItemsAtom);
    const resultMap = {} as {[datasourceId: string]: string};
    Object.entries(allItems).forEach(([key, itemMap]) => {
        const latestEditedTime = Object.values(itemMap).reduce((acc, cur) => {
            if (cur.lastEditedTime.localeCompare(acc) > 0) {
                return cur.lastEditedTime;
            } else {
                return acc;
            }
        }, '');
        resultMap[key] = latestEditedTime;
    });
    return resultMap;
})