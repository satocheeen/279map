import axios from 'axios';

export type BroadcastItemParam = {
    mapId: string;
    operation: 'insert' | 'update' | 'delete';
    itemIdList: string[];
}

export async function callBroadcast(param: BroadcastItemParam) {
    const url = `http://${process.env.MAIN_SERVICE_HOST}:${process.env.MAIN_SERVICE_PORT}/api/broadcast/`;

    try {
        const res = await axios.post(url, param);
        return res.data;
    } catch(e) {
        throw 'broadcast failed:' + e;
    }
}
