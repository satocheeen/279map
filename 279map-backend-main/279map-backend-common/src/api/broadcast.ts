import axios from 'axios';
import { DataId, MapKind } from '../types-common/common-types';

export type BroadcastItemParam = {
    // 指定のデータに対して変更があった場合
    operation: 'data-insert' | 'data-update';
    targets: DataId[];
} | {
    // 指定のデータが削除された場合
    operation: 'data-delete';
    targets: {
        id: DataId;
        map: {
            id: string;
            kind: MapKind;
        }[];    // 複数の地図に属している場合もあるので
    }[];
} | {
    // 指定のデータソース定義に更新があった場合
    operation: 'datasource-define-update';
    datasourceId: string;
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
