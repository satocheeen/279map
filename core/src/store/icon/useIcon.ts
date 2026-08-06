import { useCallback } from "react";
import { currentDefaultIconAtom, currentMapIconDefineAtom } from ".";
import { useAtom } from "jotai";
import { IconKey } from "../../types-common/common-types";

/**
 * アイコンに関するフック
 * @returns 
 */
export default function useIcon() {
    const [ currentDefaultIcon ] = useAtom(currentDefaultIconAtom);
    const [ currentMapIconDefine ] = useAtom(currentMapIconDefineAtom);

    /**
     * 指定のアイコンキーに対応するアイコン定義を返す
     */
    const getIconDefine = 
        useCallback((iconInfo?: IconKey) => {
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
