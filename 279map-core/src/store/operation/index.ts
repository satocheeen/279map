import { DataId } from "279map-common";
import { atom } from "jotai";
import { MapMode } from "../../types/types";
import { Extent } from "ol/extent";

// 選択中アイテムID
export const selectedItemIdsAtom = atom<DataId[]>([]);

export const mapModeAtom = atom<MapMode>(MapMode.Normal);

type ViewInfo = {
    extent: Extent;
    zoom: number | undefined;
}
/**
 * ユーザの地図表示範囲
 */
export const mapViewAtom = atom<ViewInfo>({
    extent: [0,0,0,0],
    zoom: 0,
})