import { DataId } from "279map-common";
import { atom } from "recoil";
import { SearchResult } from "tsunagumap-api";
import { MapMode } from "../../entry";

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
