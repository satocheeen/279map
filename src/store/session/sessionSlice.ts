import { Auth } from "279map-common/dist/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadMapDefine } from "../data/dataThunk";

const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        auth: Auth.View,
    },
    reducers: {
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
