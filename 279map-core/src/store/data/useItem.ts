import { useCallback } from "react";
import { useMap } from "../../components/map/useMap";
import { GetItemsAPI, GetItemsParam } from "tsunagumap-api";
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { itemMapState } from "./dataAtom";
import { getMapKey } from "./dataUtility";
import { DataId } from "279map-common";
import { dataSourceGroupsState } from "../datasource";

export function useItem() {
    const dataSourceGroups = useRecoilValue(dataSourceGroupsState);
    const { getApi } = useMap();
    const setItemMap = useSetRecoilState(itemMapState);

    /**
     * 指定のズームLv., extentに該当するアイテムをロードする
     */
    const loadItems = useCallback(async(param: Omit<GetItemsParam, 'dataSourceIds'>) => {
        try {
            const dataSourceIds: string[] = [];
            for (const group of dataSourceGroups) {
                if (!group.visible) continue;
                for (const ds of group.dataSources) {
                    if (!ds.visible) continue;
                    dataSourceIds.push(ds.dataSourceId);
                }
            }
            const apiResult = await getApi().callApi(GetItemsAPI, {
                extent: param.extent,
                zoom: param.zoom,
                dataSourceIds,
            });
    
            const items = apiResult.items;
            if (items.length === 0) return;

            setItemMap((currentItemMap) => {
                const itemMap = Object.assign({}, currentItemMap);
                items.forEach(def => {
                    itemMap[getMapKey(def.id)] = def;
                });
                return itemMap;
            });
    
        } catch (e) {
            console.warn('loadItems error', e);
            throw e;
        }

    }, [dataSourceGroups, getApi, setItemMap]);

    const removeItems = useCallback(async(target: DataId[]) => {
        if (target.length === 0) return;

        setItemMap((currentItemMap) => {
            const itemMap = Object.assign({}, currentItemMap);
            target.forEach(def => {
                delete itemMap[getMapKey(def)];
            });
            return itemMap;
        });

        // TODO: contentsから除去
        // state.contentsList = state.contentsList.filter(content => {
        //     const isDeleted = action.payload.some(id => isEqualId(content.itemId, id));
        //     return !isDeleted;
        // });

        // eventから除去 TODO: サーバーから再取得して設定

    }, [setItemMap]);

    return {
        loadItems,
        removeItems,
    }
}