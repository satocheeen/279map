import { useAtomCallback } from "jotai/utils";
import { useCallback, useContext } from "react";
import { MapKind, SwitchMapKindDocument } from "../../graphql/generated/graphql";
import { clientAtom } from "jotai-urql";
import { currentMapDefineAtom } from "../session";
import { OwnerContext } from "../../components/TsunaguMap/TsunaguMap";
import { loadedItemMapAtom, storedItemsAtom } from "../item";
import { dataSourceVisibleAtom } from "../datasource";

export function useMapController() {
    const { onMapLoad } = useContext(OwnerContext);

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

            if (onMapLoad) {
                const callbackResult = await onMapLoad({
                    mapKind,
                    contentDatasources: data.contentDataSources,
                    itemDatasources: data.itemDataSources,
                })
                if (callbackResult && callbackResult.initialItemLayerVisibles) {
                    // レイヤ表示の初期状態を指定する
                    const visibleInfoMap = {} as {[id: string]: boolean};
                    callbackResult.initialItemLayerVisibles.forEach(info => {
                        visibleInfoMap[info.datasourceId] = info.visible;
                    })
                    set(dataSourceVisibleAtom, visibleInfoMap);
                }
            }
            set(storedItemsAtom, {});
            set(loadedItemMapAtom, {});

        
        }, [onMapLoad])
    );

    return {
        loadMap,
    }

}