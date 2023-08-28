import { DataId, ItemDefine } from '279map-common';
import { atom, atomFamily, selectorFamily } from 'recoil';

type Key = {
    datasourceId: string;
}
export const itemsState = atomFamily<ItemDefine[], Key>({
    key: 'itemState',
    default: [],
})

export const itemState = selectorFamily<ItemDefine | undefined, DataId>({
    key: 'itemState',
    get: (dataId) => ({ get }) => {
        const items = get(itemsState({datasourceId: dataId.dataSourceId}));
        return items.find(item => item.id.id === dataId.id);
    }
})

export const itemMapState = atom<{[id: string]: ItemDefine}>({
    key: 'itemMapAtom',
    default: {}
})

// アイテムの初回ロード完了しているかどうかのフラグ
export const initialItemLoadedState = atom<boolean>({
    key: 'initialItemLoadedAtom',
    default: false,
})