import { useAtomCallback } from "jotai/utils";
import { useItem } from "./item/useItem";
import { useCallback } from "react";
import { MapKind } from "279map-common";
import { GetMapInfoAPI } from "tsunagumap-api";
import { currentMapKindAtom, mapDefineAtom } from "./session";
import { useMap } from "../components/map/useMap";

export function useMapController() {
    const { getApi } = useMap();
    const { removeItems, resetItems } = useItem();

    const loadMapDefine = useAtomCallback(
        useCallback(async(get, set, mk: MapKind) => {
            const res = await getApi().callApi(GetMapInfoAPI, {
                mapKind: mk,
            });
            set(mapDefineAtom, res);
            resetItems();
        }, [resetItems, getApi])
    )

    const changeMapKind = useAtomCallback(
        useCallback(async(get, set, mk: MapKind) => {
            const mapKind = get(currentMapKindAtom);
            if (mk === mapKind) {
                console.log('debug 同一', mk, mapKind)
                return;
            }
            await loadMapDefine(mk);
        }, [loadMapDefine])
    );

    return {
        loadMapDefine,
        changeMapKind,
    }

}