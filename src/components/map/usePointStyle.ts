import { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";
import { getStructureScale } from "../../util/MapUtility";
import { useCallback } from "react";
import useIcon from "../../store/useIcon";
import { IconInfo } from "279map-common/dist/types";
import { SystemIconDefine } from "../../types/types";

type Props = {
    structureLayer?: VectorLayer<VectorSource>; // 建物レイヤ
}

type ForceStyleFunc = (feature: FeatureLike) => {
    color?: string;
    alpha?: number;
    iconDefine?: SystemIconDefine;
}
/**
 * 建物や地点のスタイルを生成するためのクラス
 */
export default function usePointStyle(props: Props) {
    const iconHook = useIcon();

    const getZindex = useCallback((feature: FeatureLike): number => {
        const pointsSource = props.structureLayer?.getSource();
        if (!pointsSource) {
            return 0;
        }
        // 地図上でY座標が下のものほど手前に表示するようにする
        const allExtent = pointsSource.getExtent();
        const maxY = Math.max(allExtent[1], allExtent[3]);
        const extent = feature.getGeometry()?.getExtent();
        if (extent === undefined) {
            return 0;
        }
        const zIndex = Math.round(Math.abs(extent[1] - maxY));
    
        return zIndex;
    }, [props.structureLayer]);

    /**
     * @param forceColorFunc featureに強調色を設定する場合に色を返すfunction
     * @returns 
     */
    const getStructureStyleFunction = useCallback((forceStyleFunc?: ForceStyleFunc) => {
        return (feature: FeatureLike, resolution: number) => {
            const forceStyle = forceStyleFunc ? forceStyleFunc(feature) : undefined;
    
            const type = feature.getGeometry()?.getType();
            switch(type) {
                case "Point":
                    const icon = feature.getProperties().icon as IconInfo | undefined;
                    const iconDefine = forceStyle?.iconDefine ? forceStyle.iconDefine : iconHook.getIconDefine(icon);

                    const scale = getStructureScale(resolution);
                    // 地図上でY座標が下のものほど手前に表示するようにする
                    const zIndex = getZindex(feature);
                
                    return new Style({
                        image: new Icon({
                            anchor: [0.5, 1],
                            anchorXUnits: 'fraction', //IconAnchorUnits.FRACTION,
                            anchorYUnits: 'fraction', //IconAnchorUnits.FRACTION,
                            src: iconDefine.imagePath,
                            color: forceStyle?.color ? forceStyle.color : iconDefine.defaultColor,
                            opacity: forceStyle?.alpha,
                            scale,
                        }),
                        zIndex,
                    });

                default:
                    console.warn('地点以外のfeature', feature);
                    return new Style();
            }

        }
    
    }, [getZindex, iconHook]);

    return {
        getStructureStyleFunction,
    };
}