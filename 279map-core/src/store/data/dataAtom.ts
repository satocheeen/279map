import { CategoryDefine, ContentsDefine, EventDefine, ItemDefine } from '279map-common';
import { atom, selector } from 'recoil';
import { SystemIconDefine } from '../../entry';
import { dataSourceGroupsState } from '../datasource';
import { GetCategoryAPI } from 'tsunagumap-api';
import { getAPICallerInstance } from '../../api/ApiCaller';

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

export const categoryState = selector<CategoryDefine[]>({
    key: 'categoryState',
    get: async({ get }) => {
        try {
            const instanceId = get(instanceIdState);
            const apiCaller = getAPICallerInstance(instanceId)

            const dataSourceGroups = get(dataSourceGroupsState);
            const targetDataSourceIds = [] as string[];
            dataSourceGroups.forEach(group => {
                if (!group.visible) return;
                group.dataSources.forEach(ds => {
                    if (ds.visible) {
                        targetDataSourceIds.push(ds.dataSourceId);
                    }
                })
            })
            const apiResult = await apiCaller.callApi(GetCategoryAPI, {
                dataSourceIds: targetDataSourceIds.length > 0 ? targetDataSourceIds : undefined,
            });

            return apiResult;
    
        } catch (e) {
            console.warn('loadEvents error', e);
            return [];
        }

    }
})

export const eventsState = atom<EventDefine[]>({
    key: 'eventsAtom',
    default: [],
})

export const originalIconDefineState = atom<SystemIconDefine[]>({
    key: 'originalIconDefineAtom',
    default: [],
})
