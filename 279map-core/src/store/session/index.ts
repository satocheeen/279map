import { ConnectAPI, ConnectResult, ErrorType } from 'tsunagumap-api';
import { Auth, MapKind } from '279map-common';
import { ApiException, callApi } from '../../api/api';
import { Extent } from "ol/extent";
import { atom } from 'jotai';
import { atomWithReducer, loadable, selectAtom } from 'jotai/utils';
import { Loadable } from 'jotai/vanilla/utils/loadable';
import { ServerInfo } from '../../types/types';
import { atomWithCountup } from '../../util/jotaiUtility';
import { clientAtom } from 'jotai-urql';
import { SwitchMapKindDocument, SwitchMapKindMutation } from '../../graphql/generated/graphql';

export const instanceIdAtom = atomWithCountup('instance-');

export const mapIdAtom = atom<string>('');

export const serverInfoAtom = atom<ServerInfo>({
    host: window.location.host,
    ssl: window.location.protocol === 'https:',
});

export const connectReducerAtom = atomWithReducer(0, (prev) => prev+1);
export const connectStatusAtom = atom<Promise<ConnectResult>>(async( get ) => {
    try {
        get(connectReducerAtom);

        const mapId = get(mapIdAtom);
        console.log('connect to', mapId);

        const serverInfo = get(serverInfoAtom);
        const json = await callApi(serverInfo, undefined, ConnectAPI, {mapId});

        return json;

    } catch(e) {
        throw new ApiException({
            type: ErrorType.IllegalError,
            detail: e + '',
        })
    }
})
export const recreatedGqlClientReducerAtom = atomWithReducer(0, (prev) => prev+1);

export const connectStatusLoadableAtom = loadable(connectStatusAtom);

// ユーザに表示指定された地図種別
export const specifiedMapKindAtom = atom<MapKind|undefined>(undefined);

export const mapDefineReducerAtom = atomWithReducer(0, (prev) => prev+1);
type SwitchMapKindResult = SwitchMapKindMutation['switchMapKind']
type MapDefineType = SwitchMapKindResult & {
    mapKind: MapKind
}
const mapDefineAtom = atom<Promise<MapDefineType>>(async(get) => {
    get(mapDefineReducerAtom);
    get(recreatedGqlClientReducerAtom);

    const connectStatus = await get(connectStatusAtom);
    const specifiedMapKind = get(specifiedMapKindAtom);
    const mapKind = specifiedMapKind ?? connectStatus.mapDefine.defaultMapKind;
    
    const gqlClient = get(clientAtom);
    const res = await gqlClient.mutation(SwitchMapKindDocument, {
        mapKind,
    });
    if (!res.data) {
        throw res.error;
    }
    const data = res.data.switchMapKind;
    return {
        mapKind,
        ...data
    };
});
export const mapDefineLoadableAtom = loadable(mapDefineAtom);

/**
 * 地図定義情報。
 * 地図種別切り替え時、新データ取得までは切替前の情報を保持する
 */
export const currentMapDefineAtom = selectAtom<Loadable<Promise<MapDefineType>>, MapDefineType|undefined>(mapDefineLoadableAtom, (current, prev) => {
    if (current?.state === 'hasData') {
        return current.data;
    } else {
        return prev;
    }
})

// 現在表示中の地図種別。地図情報ロード完了後は、specifiedMapKindと等しい値になる。
export const currentMapKindAtom = atom<MapKind|undefined>((get) => {
    const mapDefine = get(currentMapDefineAtom);
    return mapDefine?.mapKind;
})

/**
 * 初期エクステント
 * （将来的には、ユーザが最後に参照していたエクステントを記録して、それを反映するようにしたい）
 */
export const defaultExtentAtom = atom<Extent>((get) => {
    const mapDefineLoadable = get(mapDefineLoadableAtom);
    if (mapDefineLoadable.state === 'hasData') {
        return mapDefineLoadable.data.extent;
    } else {
        return [0,0,0,0];
    }
})

export const authLvAtom = atom<Auth>(( get ) => {
    const connectStatus = get(connectStatusLoadableAtom);
    if (connectStatus.state !== 'hasData') return Auth.None;
    switch(connectStatus.data.mapDefine.authLv) {
        case Auth.None:
        case Auth.Request:
            return connectStatus.data.mapDefine.guestAuthLv;
        default:
            return connectStatus.data.mapDefine.authLv;
    }
})