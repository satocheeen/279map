import { IconInfo } from "279map-common/dist/types";
import { useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { OwnerContext } from "../components/TsunaguMap/TsunaguMap";
import { SystemIconDefine } from "../types/types";
import { RootState } from "./configureStore";
import defaultIcon from './pin.png'

/**
 * アイコンに関するフック
 * @returns 
 */
export default function useIcon() {
    const currentMapKind = useSelector((state: RootState) => state.data.mapKind);
    const ownerContext = useContext(OwnerContext);
    const originalIconDefine = useSelector((state: RootState) => state.data.originalIconDefine);

    const iconDefine = useMemo(() => {
        const defaultIconDefine = ownerContext.iconDefine ?? [];
        const list = defaultIconDefine.map(def => {
            return Object.assign({
                type: 'system',
            } as SystemIconDefine, def);
        });
        Array.prototype.push.apply(list, originalIconDefine);
        return list;        
    }, [ownerContext, originalIconDefine]);

    /**
     * 現在の地図で使用可能なアイコン定義情報を返す
     */
    const currentMapIconDefine = useMemo((): SystemIconDefine[] => {
        const list = iconDefine.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);
        if (list.length > 0) {
            return list;
        }
        return [
            {
                id: 'pin',
                imagePath: defaultIcon,
                useMaps: [currentMapKind],
                menuViewCustomCss: {
                    filter: 'opacity(0.5) drop-shadow(0 0 0 #aaa)',
                },
                defaultColor: '#aaf',
                type: 'system',
            }
        ];
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
