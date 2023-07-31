import { atom, selector } from "recoil";
import { SearchAPI, SearchResult } from "tsunagumap-api";
import { instanceIdState } from "../session";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { DataId, FilterDefine } from "279map-common";
import { visibleDataSourceIdsState } from "../datasource";

export const filterConditionState = atom<FilterDefine[] | undefined>({
    key: 'filterConditionState',
    default: undefined,
})

export const filteredItemsState = selector<SearchResult['items'] | null>({
    key: 'filteredItemsState',
    get: async({ get }) => {
        const conditions = get(filterConditionState);
        if (!conditions) return null;

        const instanceId = get(instanceIdState);
        const apiCaller = getAPICallerInstance(instanceId);
        const visibleDataSourceIds = get(visibleDataSourceIdsState);
        const res = await apiCaller.callApi(SearchAPI, {
            conditions,
            dataSourceIds: visibleDataSourceIds,
        });
        console.log('search', res);

        return res.items;
    }
});

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
