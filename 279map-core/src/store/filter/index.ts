import { atom, selector } from "recoil";
import { SearchResult } from "tsunagumap-api";
import { DataId } from "279map-common";

export const filteredItemsState = atom<SearchResult['items'] | null>({
    key: 'filteredItemsState',
    default: null,
})

/**
 * フィルタのかかっているアイテムidを返す。
 * フィルタ設定されていない場合は、undefined.
 */
export const filteredItemIdListState = selector<DataId[] | undefined>({
    key: 'filteredItemIdListState',
    get: ({ get }) => {
        const filteredItems = get(filteredItemsState);
        if (!filteredItems) {
            return undefined;
        }
        return filteredItems.map(fi => fi.id);
    }
})

/**
 * フィルタのかかっているコンテンツidを返す。
 * フィルタ設定されていない場合は、undefined.
 */
export const filteredContentIdListState = selector<DataId[] | undefined>({
    key: 'filteredContentIdListState',
    get: ({ get }) => {
        const filteredItems = get(filteredItemsState);
        if (!filteredItems) {
            return undefined;
        }
        return filteredItems.reduce((acc, cur) => {
            return acc.concat(cur.contents);
        }, [] as DataId[]);
    }
})
