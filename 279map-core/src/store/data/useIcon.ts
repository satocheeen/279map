import { IconInfo, MapKind } from "279map-common";
import { useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { OwnerContext } from "../../components/TsunaguMap/TsunaguMap";
import { SystemIconDefine } from "../../types/types";
import { RootState } from "../configureStore";
import defaultIcon from './pin.png'
import { useRecoilState } from "recoil";
import { originalIconDefineState } from "./dataAtom";
import { useMap } from "../../components/map/useMap";
import { GetOriginalIconDefineAPI } from "tsunagumap-api";

function getDefaultIconDefine(useMaps: MapKind[]): SystemIconDefine {
    return {
        id: 'default',
        imagePath: defaultIcon,
        useMaps,
        // menuViewCustomCss: {
        //     filter: 'opacity(0.5) drop-shadow(0 0 0 #aaa)',
        // },
        // defaultColor: '#77f',
        type: 'system',
    }
}
/**
 * アイコンに関するフック
 * @returns 
 */
export default function useIcon() {
    const [ originalIconDefine, setOriginalIconDefine ] = useRecoilState(originalIconDefineState)
    const { getApi } = useMap();
    const ownerContext = useContext(OwnerContext);
    const currentMapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);

    const loadOriginalIconDefine = useCallback(async() => {
        try {
            const apiResult = await getApi().callApi(GetOriginalIconDefineAPI, undefined);
            const originalDefines = apiResult.map(def => {
                return {
                    type: 'original',
                    id: def.id,
                    caption: def.caption,
                    imagePath: def.imagePath,
                    useMaps: def.useMaps,
                } as SystemIconDefine;
            })
            setOriginalIconDefine(originalDefines);
        } catch(e) {
            console.warn('getOriginalIconDefine error', e);
            throw e;
        }

    }, [getApi, setOriginalIconDefine]);

    const iconDefine = useMemo(() => {
        const defaultIconDefine = ownerContext.iconDefine ?? [];
        const list = defaultIconDefine.map(def => {
            if (def.id === 'default') {
                return getDefaultIconDefine(def.useMaps);
            }
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
        if (!currentMapKind) return [];
        
        const list = iconDefine.filter(def => def.useMaps.indexOf(currentMapKind) !== -1);
        if (list.length > 0) {
            return list;
        }
        const defaultIconDefine = getDefaultIconDefine([currentMapKind]);
        return [defaultIconDefine];
        
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
        loadOriginalIconDefine,
        currentMapIconDefine,
        getIconDefine,
    }
}
