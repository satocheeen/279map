import { Icon, Style } from "ol/style";
import { IconKey } from "../../entry";
import { FeatureColor } from "./types";
import { Opacity } from "./useFilterStatus";

type StyleItem = {
    iconKey: IconKey;
    color?: FeatureColor;
    opacity: Opacity;
    style: Style;
}
export type StyleKey = {
    iconKey: IconKey;
    color?: FeatureColor;
    opacity?: Opacity;
}
/**
 * Pointのスタイルを管理するクラス。
 * 生成するStyleクラスを最小に抑える目的で用意。
 */
export default class PointStyleMap {
    _styles: StyleItem[] = [];

    _getItem(param: StyleKey) {
        return this._styles.find(item => {
            if (!(item.iconKey.id === param.iconKey.id && item.iconKey.type === param.iconKey.type)) {
                return false;
            }
            if (item.color !== param.color) return false;
            if (item.opacity !== (param.opacity ?? Opacity.Normal)) return false;
            return true;
        });
    }

    get(key: StyleKey) {
        return this._getItem(key)?.style;
    }

    set(key: StyleKey, value: Style) {
        const hit = this._getItem(key);
        if (hit) {
            hit.style = value;
        } else {
            this._styles.push({
                iconKey: key.iconKey,
                color: key.color,
                opacity: key.opacity ?? Opacity.Normal,
                style: value,
            })
        }
    }
}