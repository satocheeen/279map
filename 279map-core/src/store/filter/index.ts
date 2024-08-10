import { atom } from "jotai";
import { DataId } from "../../types-common/common-types";
import { storedItemsAtom } from "../item";

export const filteredDatasAtom = atom<DataId[] | null>(null);

/**
 * フィルタのかかっているアイテムidを返す。
 * フィルタ設定されていない場合は、undefined.
 */
export const filteredItemIdListAtom = atom<DataId[] | undefined>(( get ) => {
    const filteredDatas = get(filteredDatasAtom);
    if (!filteredDatas) {
        return undefined;
    }
    const storedItems = get(storedItemsAtom);
    return storedItems.filter(item => {
        const itemHit = filteredDatas.includes(item.id);
        if (itemHit) return true;
        const childHit = item.content?.linkedContents.some(id => filteredDatas.includes(id));
        return !!childHit;
    }).map(item => item.id);
})
