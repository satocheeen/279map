import { FeatureLike } from "ol/Feature";
import { useCallback } from "react";
import { Fill, Style } from 'ol/style';
import { colorWithAlpha } from "../../util/CommonUtility";
import { useAtomCallback } from "jotai/utils";
import { gridRangeMapAtom } from "../../store/item";
import { convertDataIdFromFeatureId } from "../../util/dataUtility";
import { GridProperties } from "../../entry";

export default function useGridStyle() {
    const gridStyleFunction = useAtomCallback(
        useCallback((get, set, feature: FeatureLike, resolution: number): Style => {
            // データソースの最大値、最低値を取得
            const idStr = feature.getId() as string;
            const id = convertDataIdFromFeatureId(idStr);
            const gridRangeMap = get(gridRangeMapAtom);
            const range = gridRangeMap[id.dataSourceId] ?? {min: 0, max: 0};

            const properties = feature.getProperties() as GridProperties;
            const value = properties.value;
            const per = (value - range.min + 1) / (range.max - range.min + 1);
            const hex = Math.round(255 * per).toString(16);
            const color = `#${hex}aaaa`;

            return new Style({
                fill: new Fill({
                    color: colorWithAlpha(color, .5),
                }),
            });
        }, [])
    );

    return {
        gridStyleFunction,
    }
}