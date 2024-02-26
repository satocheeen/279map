import { atom } from 'jotai';
import { currentMapDefineAtom } from '../session';

/**
 * データソース関連のRecoil
 */

// レイヤ表示情報 key=データソースid
type ItemLayerVisibleInfo = {[id: string]: boolean};

/**
 * データソースの表示・非表示情報（ユーザから明示的に指定されたものを格納）
 */
export const dataSourceVisibleAtom = atom<ItemLayerVisibleInfo>({});

/**
 * データソースグループをデータソースにばらしたもの
 */
export const itemDataSourcesAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    return mapDefine.itemDataSources;
})

/**
 * コンテンツのデータソース一覧
 */
export const contentDataSourcesAtom = atom((get) => {
    const mapDefine = get(currentMapDefineAtom);
    if (!mapDefine) return [];
    return mapDefine.contentDataSources;
})

export const visibleDataSourceIdsAtom = atom((get) => {
    const dataSources = get(itemDataSourcesAtom);
    const visibleInfo = get(dataSourceVisibleAtom);
    return dataSources.filter(ds => {
        const visible = visibleInfo[ds.datasourceId];
        if (visible !== undefined) return visible;
        return ds.initialVisible;
    }).map(ds => ds.datasourceId);
})
