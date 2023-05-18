import axios from 'axios';
import { DataId } from '279map-common';

export type BroadcastItemParam = {
    mapId: string;
    operation: 'insert' | 'update' | 'delete';
    itemIdList: DataId[];
}

export async function callBroadcast(param: BroadcastItemParam) {
    const url = `http://${process.env.MAIN_SERVICE_HOST}:${process.env.MAIN_SERVICE_PORT}/api/broadcast/`;

    try {
        const res = await axios.post(url, param, {
            timeout: 10000,
        });
        return res.data;
    } catch(e) {
        throw 'broadcast failed:' + e;
    }
}
