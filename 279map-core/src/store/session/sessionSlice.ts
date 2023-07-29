import { MapDefine } from "279map-common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiAccessError, ServerInfo } from "../../types/types";

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
        instanceId: '', // OwnerContextのinstanceIdと同値
        // mapServer: {
        //     host: '',
        //     ssl: false,
        // } as ServerInfo,
        // connectStatus: {
        //     status: 'connecting-map',
        // } as ConnectStatus,
        // currentMapKindInfo: undefined as undefined | {
        //     mapKind: MapKind;
        //     extent: Extent;
        // }
    },
    reducers: {
        // setMapServer(state, action: PayloadAction<ServerInfo>) {
        //     state.mapServer = action.payload;
        //     state.currentMapKindInfo = undefined;
        // },
        setInstanceId(state, action: PayloadAction<string>) {
            state.instanceId = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
        // .addCase(loadMapDefine.fulfilled, (state, action) => {
        //     if (action.payload.result === 'success') {
        //         state.currentMapKindInfo = {
        //             mapKind: action.payload.mapInfo.mapKind,
        //             extent: action.payload.mapInfo.extent,
        //     };
   
        //     } else {
        //         state.connectStatus = {
        //             status: 'failure',
        //             error: action.payload.error,
        //         }
        //     }
        // })
    }
})

export const sessionActions = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
