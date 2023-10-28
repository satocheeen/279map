import { DataId } from "279map-common";
import { atom } from "jotai";
import { MapMode } from "../../types/types";
import { Extent } from "ol/extent";
import { Coordinate } from "ol/coordinate";

// 詳細ダイアログ表示対象
type Target = {
    type: 'item' | 'content';
    id: DataId;
}
export const dialogTargetAtom = atom<Target|undefined>(undefined);

// 詳細表示中アイテムID
export const showingDetailItemIdAtom = atom<DataId|null>((get) => {
    const dialogTarget = get(dialogTargetAtom);
    if (!dialogTarget) return null;
    if (dialogTarget.type === 'item') {
        return dialogTarget.id;
    } else {
        return null;
    }
});


export const mapModeAtom = atom(
    MapMode.Normal,
    (get, set, update: MapMode) => {
        const current = get(mapModeAtom);
        if (current === update) {
            return;
        }
        set(mapModeAtom, update);
        // 地図モード変更時は、選択状態解除する
        set(dialogTargetAtom, undefined);
    }
);

type ViewInfo = {
    extent: Extent;
    zoom: number | undefined;
}
/**
 * ユーザの地図表示範囲
 */
export const mapViewAtom = atom<ViewInfo>({
    extent: [0,0,0,0],
    zoom: 0,
})

/**
 * 重畳選択メニュー強制表示対象
 */
type DoShowClusterMenuParam = {
    position: Coordinate;
    targets: DataId[];
}
export const doShowClusterMenuAtom = atom<DoShowClusterMenuParam|undefined>(undefined);
