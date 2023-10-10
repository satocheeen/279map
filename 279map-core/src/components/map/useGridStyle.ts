import { FeatureLike } from "ol/Feature";
import { useCallback } from "react";
import { Fill, Style } from 'ol/style';
import { colorWithAlpha } from "../../util/CommonUtility";

export default function useGridStyle() {
    const gridStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        return new Style({
            fill: new Fill({
                color: colorWithAlpha('#faa', .5),
            }),
        });
    }, []);

    return {
        gridStyleFunction,
    }
}