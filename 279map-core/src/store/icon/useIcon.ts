import { IconInfo } from "279map-common";
import { useCallback } from "react";
import { useRecoilValue } from "recoil";
import { currentDefaultIconState, currentMapIconDefineState } from ".";

/**
 * アイコンに関するフック
 * @returns 
 */
export default function useIcon() {
    const currentDefaultIcon = useRecoilValue(currentDefaultIconState);
    const currentMapIconDefine = useRecoilValue(currentMapIconDefineState);

    /**
     * 指定のアイコンキーに対応するアイコン定義を返す
     */
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
        getIconDefine,
    }
}
