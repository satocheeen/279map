import { DataId } from "279map-common";
import { atom } from "recoil";
import { SearchResult } from "tsunagumap-api";
import { MapMode } from "../../entry";
import { Extent } from "ol/extent";

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
export const mapViewState = atom<ViewInfo>({
    key: 'mapViewAtom',
    default: {
        extent: [0,0,0,0],
        zoom: 0,
    },
})