import { Auth } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ServerInfo } from "../../types/types";
import { loadMapDefine } from "../data/dataThunk";

const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        auth: Auth.View,
        mapServer: {
            domain: '',
            ssl: true,
        } as ServerInfo,
    },
    reducers: {
        setMapServer(state, action: PayloadAction<ServerInfo>) {
            state.mapServer = action.payload;
        },
        setAuth(state, action: PayloadAction<Auth>) {
            state.auth = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            state.auth = action.payload.authLv;
        })
    }
})

export const sessionActions = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
