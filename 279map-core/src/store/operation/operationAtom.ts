import { atom } from "recoil";
import { SearchResult } from "tsunagumap-api";

export const filteredItemsState = atom<SearchResult['items'] | null>({
    key: 'filteredItemsAtom',
    default: null,
});
