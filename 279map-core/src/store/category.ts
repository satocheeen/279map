import { CategoryDefine } from '279map-common';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from './datasource';
import { atomWithQuery } from 'jotai-urql';
import { GetCategoryDocument } from '../graphql/generated/graphql';

export const categoriesQueryAtom = atomWithQuery({
    query: GetCategoryDocument,
    getVariables: (get) => {
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        return {
            dataSourceIds: targetDataSourceIds,
        }
    },
})
export const categoriesAtom = atom(async(get) => {
    const categoriesQuery = await get(categoriesQueryAtom);
    console.log('debug', categoriesQuery);
    // @ts-ignore
    return (categoriesQuery.data?.getCategory ?? []) as CategoryDefine[];
})

export const categoriesLoadableAtom = loadable(categoriesAtom);