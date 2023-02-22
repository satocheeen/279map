import { ConfigAPI } from "tsunagumap-api";
import { ServerInfo } from "../entry";
import { callApi } from "./api";

export async function getAuth0Config(host: string) {
    const mapServer = {
        domain: host,
        ssl: true,
    } as ServerInfo;

    try {
        const result = await callApi(mapServer, ConfigAPI, undefined)
        return {
            domain: result.auth0.domain,
            clientId: result.auth0.clientId,
            audience: result.auth0.audience,
        }

    } catch(e) {
        console.warn('get server config failed.', e);
        return null;
    }
}