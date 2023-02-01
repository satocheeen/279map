import { Auth, MapKind } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ServerInfo } from "../../types/types";
import { connectMap, loadMapDefine } from "./sessionThunk";
import { Extent } from 'ol/extent';

export type ConnectedMap = {
    mapId: string;
    name: string;
    useMaps: MapKind[];
    defaultMapKind: MapKind;
    authLv: Auth;
}
const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        mapServer: {
            domain: '',
            ssl: true,
        } as ServerInfo,
        connectedMap: undefined as undefined | ConnectedMap,
        currentMapKindInfo: undefined as undefined | {
            mapKind: MapKind;
            extent: Extent,
        },
    },
    reducers: {
        setMapServer(state, action: PayloadAction<ServerInfo>) {
            state.mapServer = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(connectMap.fulfilled, (state, action) => {
            state.connectedMap = action.payload;
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
