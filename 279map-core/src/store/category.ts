import { atom } from 'jotai';
import { visibleDataSourceIdsAtom } from './datasource';
import { atomWithQuery } from 'jotai-urql';
import { GetCategoryDocument } from '../graphql/generated/graphql';

const categoriesQueryAtom = atomWithQuery({
    query: GetCategoryDocument,
    getVariables: (get) => {
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        return {
            datasourceIds: targetDataSourceIds,
        }
    },
    getPause(get) {
        // 表示対象データがない場合は実行しない
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        return targetDataSourceIds.length === 0;
    }
})
export const categoriesAtom = atom(async(get) => {
    const categoriesQuery = await get(categoriesQueryAtom);
    const result = categoriesQuery.data?.getCategory ?? [];
    return result;
})
