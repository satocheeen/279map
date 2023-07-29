import { useCallback } from 'react';
import useDataSource from '../data/useDataSource';
import { useMap } from '../../components/map/useMap';
import { SearchAPI } from 'tsunagumap-api';
import { FilterDefine } from '279map-common';
import { useSetRecoilState } from 'recoil';
import { filteredItemsState } from './operationAtom';

export function useSearch() {
    const { getApi } = useMap();
    const { visibleDataSourceIds } = useDataSource();
    const setFilteredItems = useSetRecoilState(filteredItemsState);

    const search = useCallback(async(conditions: FilterDefine[]) => {
        const res = await getApi().callApi(SearchAPI, {
            conditions,
            dataSourceIds: visibleDataSourceIds,
        });
        console.log('search', res);
        setFilteredItems(res.items);

    }, [getApi, visibleDataSourceIds, setFilteredItems]);

    return {
        search,
    }
}