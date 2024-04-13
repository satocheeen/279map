import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { MapKind, SwitchMapKindDocument } from "../../graphql/generated/graphql";
import { clientAtom } from "jotai-urql";
import { currentMapDefineAtom } from "../session";

export function useMapController() {

    /**
     * 指定の地図種別をロードする
     * @param mapKind ロードする地図種別
     */
    const loadMap = useAtomCallback(
        useCallback(async(get, set, mapKind: MapKind) => {
            const gqlClient = get(clientAtom);
            const res = await gqlClient.mutation(SwitchMapKindDocument, {
                mapKind,
            });
            if (!res.data) {
                console.warn(res.error);
                return;
            }

            const data = res.data.switchMapKind;
            set(currentMapDefineAtom, {
                mapKind,
                ...data
            })
        
        }, [])
    );

    return {
        loadMap,
    }

}