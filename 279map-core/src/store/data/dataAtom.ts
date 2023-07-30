import { ContentsDefine, ItemDefine } from '279map-common';
import { atom } from 'recoil';

export const itemMapState = atom<{[id: string]: ItemDefine}>({
    key: 'itemMapAtom',
    default: {}
})

export const contentsState = atom<ContentsDefine[]>({
    key: 'contentsAtom',
    default: [],
})
