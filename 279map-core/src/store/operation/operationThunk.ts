import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { SearchAPI, SearchResult } from "tsunagumap-api";
import { FilterDefine } from "279map-common";
import { RootState } from "../configureStore";

export const search = createAsyncThunk<SearchResult, FilterDefine[]>(
    'operation/searchStatus',
    async(param, { rejectWithValue, getState }) => {
        try {
            const res = await getAPICallerInstance((getState() as RootState).session.instanceId).callApi(SearchAPI, {
                conditions: param,
            });
            console.log('search', res);
            return res;

        } catch(e) {
            console.warn('search error', e);
            return rejectWithValue(e);
        }
    }
)