import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { MapKind } from "279map-common";
import { specifiedMapKindAtom } from "./session";

export function useMapController() {

    const changeMapKind = useAtomCallback(
        useCallback(async(get, set, mk: MapKind) => {
            set(specifiedMapKindAtom, mk);
        }, [])
    );

    return {
        changeMapKind,
    }

}