import { ContentsDefine, ItemDefine } from '279map-common';
import { atom } from 'recoil';
import { SystemIconDefine } from '../../types/types';

export const instanceIdState = atom<string>({
    key: 'instanceIdState',
    default: '',
})

export const itemMapState = atom<{[id: string]: ItemDefine}>({
    key: 'itemMapAtom',
    default: {}
})

export const contentsState = atom<ContentsDefine[]>({
    key: 'contentsAtom',
    default: [],
})

export const originalIconDefineState = atom<SystemIconDefine[]>({
    key: 'originalIconDefineAtom',
    default: [],
})
