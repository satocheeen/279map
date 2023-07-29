import { CategoryDefine, ContentsDefine, DataSourceGroup, DataSourceInfo, EventDefine, ItemDefine } from '279map-common';
import { atom, selector } from 'recoil';
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

export const dataSourceGroupsState = atom<DataSourceGroup[]>({
    key: 'dataSourceGroupsAtom',
    default: [],
})

export const dataSourcesState = selector<DataSourceInfo[]>({
    key: 'dataSourcesSelector',
    get: ({get}) => {
        const groups = get(dataSourceGroupsState);
        return groups.reduce((acc, cur) => {
            return acc.concat(cur.dataSources);
        }, [] as DataSourceInfo[]);
    }
})
