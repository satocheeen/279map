import { ConfigAPI } from "tsunagumap-api";
import { ServerInfo } from "../entry";
import { callApi } from "./api";

export async function getServerConfig(mapServer: ServerInfo) {
    try {
        const result = await callApi(mapServer, ConfigAPI, undefined)
        return result;

    } catch(e) {
        console.warn('get server config failed.', e);
        throw new Error('get server config failed.', { cause: e});
    }
}