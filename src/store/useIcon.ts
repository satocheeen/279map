import { IconInfo } from "279map-common/dist/types";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./configureStore";

/**
 * アイコンに関するフック
 * @returns 
 */
export default function useIcon() {
    const currentMapKind = useSelector((state: RootState) => state.data.mapKind);
    const iconDefine = useSelector((state: RootState) => state.data.iconDefine);

    /**
     * 現在の地図で使用可能なアイコン定義情報を返す
     */
    const currentMapIconDefine = useMemo(() => {
        return iconDefine.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);
    }, [currentMapKind, iconDefine]);

    /**
     * アイコン未指定の場合に設定するアイコン
     */
    const currentDefaultIcon = useMemo(() => {
        // とりあえず冒頭のアイコン
        return currentMapIconDefine[0];
    }, [currentMapIconDefine]);

    const getIconDefine = useCallback((iconInfo?: IconInfo) => {
        if (!iconInfo) {
            return currentDefaultIcon;
        }
        const hit = currentMapIconDefine.find(cmid => cmid.type === iconInfo.type && cmid.id === iconInfo.id);
        if (hit) {
            return hit;
        } else {
            return currentDefaultIcon;
        }
    }, [currentMapIconDefine, currentDefaultIcon]);

    return {
        currentMapIconDefine,
        getIconDefine,
    }
}
