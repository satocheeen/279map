import { AuthManagementInterface, MapInfo } from "279map-backend-common";
import axios, { AxiosResponse } from "axios";
import path from 'path';

export class OriginalAuthManagement extends AuthManagementInterface {
    async initialize() {
        await callOriginalServer('initialize', undefined);
    }

    async getUserMapList(userId: string): Promise<string[]> {
        const res = await callOriginalServer('get-user-map-list', {
            userId,
        });
        return res;
    }
    async getUserInfoOfTheMap(userId: string, mapId: string): Promise<MapInfo | undefined> {
        const res = await callOriginalServer('get-userinfo-of-map', {
            userId,
            mapId,
        });
        return res;
    }
}

async function callOriginalServer(api: string, param: any) {
    const originalAuthUrl = (process.env.ORIGINAL_AUTH_URL ?? '');
    const url = `${originalAuthUrl}${originalAuthUrl.endsWith('/')?'':'/'}auth/${api}`;
    try {
        let res: AxiosResponse;
        res = await axios.post(url, param, {
            timeout: 10000,
        });
        if (res.status !== 200) {
            throw `original auth return errir response: ${res.status} ${res.statusText} ${res.data}`;
        }
        const result = res.data;

        return result;
    
    } catch (e) {
        throw 'connecting server failed:' + url + e;
    }

}