import { DataId, MapKind } from "279map-common";
import { atom } from "recoil";
import { SearchResult } from "tsunagumap-api";
import { MapMode } from "../../types/types";
import { Extent } from "ol/extent";

// ユーザが指定した地図種別
export const mapKindState = atom<MapKind|undefined>({
    key: 'mapKindState',
    default: undefined,
});

export const filteredItemsState = atom<SearchResult['items'] | null>({
    key: 'filteredItemsAtom',
    default: null,
});

// 選択中アイテムID
export const selectedItemIdsState = atom<DataId[]>({
    key: 'selectedItemIdsAtom',
    default: [],
});

export const mapModeState = atom<MapMode>({
    key: 'mapModeAtom',
    default: MapMode.Normal,
});

type ViewInfo = {
    extent: Extent;
    zoom: number | undefined;
}
/**
 * ユーザの地図表示範囲
 */
export const mapViewState = atom<ViewInfo>({
    key: 'mapViewAtom',
    default: {
        extent: [0,0,0,0],
        zoom: 0,
    },
})