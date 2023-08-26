import { DataId } from "279map-common";
import { atom } from "recoil";
import { MapMode } from "../../types/types";
import { Extent } from "ol/extent";

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