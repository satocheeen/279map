import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { SearchAPI, SearchResult } from "tsunagumap-api";
import { FilterDefine } from "279map-common";
import { RootState } from "../configureStore";

export const search = createAsyncThunk<SearchResult, FilterDefine[]>(
    'operation/searchStatus',
    async(param, { rejectWithValue, getState }) => {
        try {
            const targetDataSourceIds = [] as string[];
            (getState() as RootState).data.dataSourceGroups.forEach(group => {
                if (!group.visible) return;
                group.dataSources.forEach(ds => {
                    if (ds.visible) {
                        targetDataSourceIds.push(ds.dataSourceId);
                    }
                })
            })
            const res = await getAPICallerInstance((getState() as RootState).session.instanceId).callApi(SearchAPI, {
                conditions: param,
                dataSourceIds: targetDataSourceIds,
            });
            console.log('search', res);
            return res;

        } catch(e) {
            console.warn('search error', e);
            return rejectWithValue(e);
        }
    }
)