import { MapDefine, MapKind } from "../../279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConnectError, ServerInfo } from "../../types/types";
import { connectMap, loadMapDefine } from "./sessionThunk";
import { Extent } from 'ol/extent';

type ConnectStatus = {
    status: 'connecting-map',
} | {
    status: 'connected',
    connectedMap: MapDefine,
} | {
    status: 'failure',
    error: ConnectError,
}
const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        mapServer: {
            domain: '',
            ssl: true,
        } as ServerInfo,
        connectStatus: {
            status: 'connecting-map',
        } as ConnectStatus,
        currentMapKindInfo: undefined as undefined | {
            mapKind: MapKind;
            extent: Extent;
        }
    },
    reducers: {
        setMapServer(state, action: PayloadAction<ServerInfo>) {
            state.mapServer = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(connectMap.fulfilled, (state, action) => {
            if (action.payload.result === 'success') {
                state.connectStatus = {
                    status: 'connected',
                    connectedMap: action.payload.mapDefine,
                }
            } else {
                state.connectStatus = {
                    status: 'failure',
                    error: action.payload.error,
                }
            }
        })
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            state.currentMapKindInfo = {
                mapKind: action.payload.mapKind,
                extent: action.payload.extent,
            };
        })
    }
})

export const sessionActions = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
