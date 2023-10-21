import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { MapKind } from "279map-common";
import { currentMapKindAtom, specifiedMapKindAtom } from "./session";

export function useMapController() {

    const changeMapKind = useAtomCallback(
        useCallback(async(get, set, mk: MapKind) => {
            set(specifiedMapKindAtom, mk);
            return new Promise<void>((resolve) => {
                // 地図種別が切り替わるのを待つ
                const checkFunc = () => {
                    const currentMapKind = get(currentMapKindAtom);
                    if (currentMapKind !== mk) {
                        setTimeout(checkFunc, 500);
                    } else {
                        resolve();
                    }
                }
                checkFunc();
            })
        }, [])
    );

    return {
        changeMapKind,
    }

}