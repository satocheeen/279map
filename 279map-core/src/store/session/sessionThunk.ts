import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../configureStore";
import { ConnectAPI, ErrorType } from 'tsunagumap-api';
import { ConnectAPIResult } from "../../types/types";
import { getAPICallerInstance } from "../../api/ApiCaller";
import { ApiException } from "../../api";
import { createMqttClientInstance } from "./MqttInstanceManager";

// export const connectMap = createAsyncThunk<ConnectAPIResult, { instanceId: string; mapId: string; }>(
//     'session/connectMapStatus',
//     async(param, { getState, dispatch }) => {
//         const mapServer = (getState() as RootState).session.mapServer;

//         try {
//             const apiCaller = getAPICallerInstance((getState() as RootState).session.instanceId);
//             const json = await apiCaller.callApi(ConnectAPI, {
//                 mapId: param.mapId,
//             });

//             apiCaller.setSID(json.sid);

//             createMqttClientInstance(param.instanceId, mapServer.host, json.sid);

//             return {
//                 result: 'success',
//                 connectResult: json,
//             };    

//         } catch(e) {
//             console.warn('connect error', e);
//             if (e instanceof ApiException) {
//                 return {
//                     result: 'failure',
//                     error: e.apiError,
//                 }
//             }
//             return {
//                 result: 'failure',
//                 error: {
//                     type: ErrorType.IllegalError,
//                     detail: e + '',
//                 }
//             }
//         }
//     }
// )
