import { ItemDefine } from '279map-common';
import { atom } from 'recoil';

export const itemMapState = atom<{[id: string]: ItemDefine}>({
    key: 'itemMapAtom',
    default: {}
})
