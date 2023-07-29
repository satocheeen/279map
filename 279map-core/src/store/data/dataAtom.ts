import { CategoryDefine, ContentsDefine, EventDefine, ItemDefine } from '279map-common';
import { atom } from 'recoil';
import { SystemIconDefine } from '../../entry';

export const itemMapState = atom<{[id: string]: ItemDefine}>({
    key: 'itemMapAtom',
    default: {}
})

export const contentsState = atom<ContentsDefine[]>({
    key: 'contentsAtom',
    default: [],
})

export const categoryState = atom<CategoryDefine[]>({
    key: 'categoryAtom',
    default: [],
})

export const eventsState = atom<EventDefine[]>({
    key: 'eventsAtom',
    default: [],
})

export const originalIconDefineState = atom<SystemIconDefine[]>({
    key: 'originalIconDefineAtom',
    default: [],
})