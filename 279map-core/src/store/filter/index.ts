import { atom } from "jotai";
import { SearchHitItem } from "../../graphql/generated/graphql";
import { DataId } from "../../types-common/common-types";

export const filteredItemsAtom = atom<SearchHitItem[] | null>(null);

/**
 * フィルタのかかっているアイテムidを返す。
 * フィルタ設定されていない場合は、undefined.
 */
export const filteredItemIdListAtom = atom<DataId[] | undefined>(( get ) => {
    const filteredItems = get(filteredItemsAtom);
    if (!filteredItems) {
        return undefined;
    }
    return filteredItems.map(fi => fi.id);
})

/**
 * フィルタのかかっているコンテンツidを返す。
 * フィルタ設定されていない場合は、undefined.
 */
export const filteredContentIdListAtom = atom<DataId[] | undefined>(( get ) => {
    const filteredItems = get(filteredItemsAtom);
    if (!filteredItems) {
        return undefined;
    }
    return filteredItems.reduce((acc, cur) => {
        return acc.concat(cur.hitContents);
    }, [] as DataId[]);
})
