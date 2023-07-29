import { MapDefine, MapKind } from "279map-common";
import { Extent } from "ol/extent";
import { atom, selector } from "recoil";
import { ApiAccessError, ServerInfo } from "../../types/types";

// ownerContext.mapServerを使えばいいかも？
export const mapServerState = atom<ServerInfo>({
    key: 'mapServerAtom',
    default: {
        host: '',
        ssl: false,
    },
})

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
export const connectStatusState = atom<ConnectStatus>({
    key: 'connectStatusAtom',
    default: {
        status: 'connecting-map',
    },
})

type CurrentMapKindInfo = {
    mapKind: MapKind;
    extent: Extent;
}
export const currentMapKindInfoState = atom<CurrentMapKindInfo|undefined>({
    key: 'currentMapKindInfoAtom',
    default: undefined,
})

export const currentMapKindState = selector<MapKind|undefined>({
    key: 'currentMapKindSelector',
    get: ( { get } ) => {
        const mapKindInfo = get(currentMapKindInfoState);
        return mapKindInfo?.mapKind;
    }
})

export const defaultExtentState = selector<Extent>({
    key: 'defaultExtentSelector',
    get: ( { get } ) => {
        const mapKindInfo = get(currentMapKindInfoState);
        return mapKindInfo?.extent ?? [0,0,0,0];
    }
})
