import { CategoryDefine } from '279map-common';
import { GetCategoryAPI } from 'tsunagumap-api';
import { atom } from 'jotai';
import { loadable } from "jotai/utils";
import { visibleDataSourceIdsAtom } from './datasource';
import { connectStatusAtom, serverInfoAtom } from './session';
import { callApi } from '../api/api';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { createHttpLink } from 'apollo-link-http';

const GET_CATEGORY = gql`
    query get_category(
        $dataSourceIds: [String!]
    ){
        getCategory(dataSourceIds: $dataSourceIds) {
            name
        }    
    }
`;

export const categoriesAtom = atom(async(get): Promise<CategoryDefine[]> => {
    try {
        const serverInfo = get(serverInfoAtom);
        const sid = (await get(connectStatusAtom)).sid;

        // 表示中のデータソースに紐づくカテゴリを取得
        const targetDataSourceIds = get(visibleDataSourceIdsAtom);
        // const apiResult = await callApi(serverInfo, sid, GetCategoryAPI, {
        //     dataSourceIds: targetDataSourceIds,
        // });
        // return apiResult;

        const httpLink = createHttpLink({
            uri: 'http://localhost/graphql',
            headers: {
                Authorization:  serverInfo.token ? `Bearer ${serverInfo.token}` : '',
                sessionid: sid ?? '',
            },
        })
        const client = new ApolloClient({
            link: httpLink as any,
            cache: new InMemoryCache(),
          });
        
        const apiResult = await client.query({
            query: GET_CATEGORY,
            variables: {
                dataSourceIds: targetDataSourceIds,
            }
        })
        console.log('GET_CATEGOYRY', apiResult);

        return apiResult.data.getCategory;

    } catch (e) {
        console.warn('loadCategories error', e);
        return [];
    }

})

export const categoriesLoadableAtom = loadable(categoriesAtom);