import { ItemDefine } from '279map-common';
import { atom } from 'recoil';

export const itemMapState = atom<{[id: string]: ItemDefine}>({
    key: 'itemMapAtom',
    default: {}
})

// アイテムの初回ロード完了しているかどうかのフラグ
export const initialItemLoadedState = atom<boolean>({
    key: 'initialItemLoadedAtom',
    default: false,
})