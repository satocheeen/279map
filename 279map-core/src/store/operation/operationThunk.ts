import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { SearchAPI, SearchResult } from "tsunagumap-api";
import { FilterDefine } from "279map-common";

export const search = createAsyncThunk<SearchResult, FilterDefine[]>(
    'operation/searchStatus',
    async(param, { rejectWithValue }) => {
        try {
            const res = await getAPICallerInstance().callApi(SearchAPI, {
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