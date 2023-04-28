import { MapDefine, MapKind } from "../../279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiAccessError, ServerInfo } from "../../types/types";
import { connectMap, loadMapDefine } from "./sessionThunk";
import { Extent } from 'ol/extent';
import { DataSourceInfo } from "tsunagumap-api";

type ConnectStatus = {
    status: 'connecting-map',
} | {
    status: 'connected',
    connectedMap: MapDefine,
    sid: string,
} | {
    status: 'failure',
    error: ApiAccessError,
}
const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        mapServer: {
            protocol: 'http',
            domain: '',
        } as ServerInfo,
        connectStatus: {
            status: 'connecting-map',
        } as ConnectStatus,
        currentMapKindInfo: undefined as undefined | {
            mapKind: MapKind;
            extent: Extent;
            dataSources: DataSourceInfo[];
        }
    },
    reducers: {
        setMapServer(state, action: PayloadAction<ServerInfo>) {
            state.mapServer = action.payload;
        },
        updateConnectStatus(state, action: PayloadAction<ConnectStatus>) {
            state.connectStatus = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(connectMap.fulfilled, (state, action) => {
            if (action.payload.result === 'success') {
                state.connectStatus = {
                    status: 'connected',
                    connectedMap: action.payload.connectResult.mapDefine,
                    sid: action.payload.connectResult.sid,
                }
            } else {
                state.connectStatus = {
                    status: 'failure',
                    error: action.payload.error,
                }
            }
        })
        .addCase(loadMapDefine.fulfilled, (state, action) => {
            if (action.payload.result === 'success') {
                state.currentMapKindInfo = {
                    mapKind: action.payload.mapInfo.mapKind,
                    extent: action.payload.mapInfo.extent,
                    dataSources: action.payload.mapInfo.dataSources,
                };
   
            } else {
                state.connectStatus = {
                    status: 'failure',
                    error: action.payload.error,
                }
            }
        })
    }
})

export const sessionActions = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
