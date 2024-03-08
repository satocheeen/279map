import { useCallback } from "react";
import Feature, { FeatureLike } from "ol/Feature";
import { Circle, Fill, Icon, Style, Text } from 'ol/style';
import { getStructureScale } from "../../util/MapUtility";
import { SystemIconDefine } from "../../types/types";
import useFilterStatus from "./useFilterStatus";
import { Geometry } from "ol/geom";
import { convertDataIdFromFeatureId, isEqualId } from "../../util/dataUtility";
import { useMap } from "./useMap";
import { useMapOptions } from "../../util/useMapOptions";
import { selectItemIdAtom } from "../../store/operation";
import useIcon from "../../store/icon/useIcon";
import { filteredItemIdListAtom } from "../../store/filter";
import { itemDataSourcesAtom } from "../../store/datasource";
import { useAtom } from 'jotai';
import { MapStyles } from "../../util/constant-defines";
import { DatasourceKindType, IconKey } from "../../types-common/common-types";
import { useAtomCallback } from "jotai/utils";
import { currentMapKindAtom } from "../../store/session";
import { MapKind } from "../../entry";
import { currentDefaultIconAtom } from "../../store/icon";

const STRUCTURE_SELECTED_COLOR = '#8888ff';

/**
 * 建物・地点に関するスタイルを設定するフック
 * @param props 
 * @returns 
 */
export default function usePointStyle() {
    const { getForceColor, getOpacity } = useFilterStatus();
    const [ filteredItemIdList ] = useAtom(filteredItemIdListAtom);
    const { disabledLabel } = useMapOptions();
    const { getIconDefine } = useIcon();
    const { map } = useMap();
    const [ selectedItemId ] = useAtom(selectItemIdAtom);

    const getZindex = useCallback((feature: Feature<Geometry>): number => {
        if (!map) return 0;
        // featureが属するレイヤソース取得
        const pointsSource = map.getLayerInfoContainedTheFeature(feature)?.layer.getSource();
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
    }, [map]);

    const _createStyle = useAtomCallback(
        useCallback((get, set, param: {iconDefine: SystemIconDefine; feature: Feature<Geometry>; resolution: number; color?: string; opacity?: number}) => {
            const type = param.feature.getGeometry()?.getType();
            if (type !== 'Point') {
                console.warn('geometry type is not point', param.feature);
                return new Style();
            }
            const scale = getStructureScale(param.resolution);
            // 地図上でY座標が下のものほど手前に表示するようにする
            const zIndex = getZindex(param.feature);

            const mapKind = get(currentMapKindAtom);

            if (mapKind === MapKind.Virtual) {
                return new Style({
                    image: new Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction', //IconAnchorUnits.FRACTION,
                        anchorYUnits: 'fraction', //IconAnchorUnits.FRACTION,
                        src: param.iconDefine?.imagePath,
                        color: param.color,
                        opacity: param.opacity,
                        scale,
                    }),
                    zIndex,
                });

            } else {
                // ピン
                const pinIconDefine = get(currentDefaultIconAtom);
                const pinColor = function() {
                    if (!param.color) return pinIconDefine.defaultColor;
                    if (!pinIconDefine.defaultColor) return param.color;
                    return multipleColor(pinIconDefine.defaultColor, param.color);
                }();
                const style1 =  new Style({
                    image: new Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction', //IconAnchorUnits.FRACTION,
                        anchorYUnits: 'fraction', //IconAnchorUnits.FRACTION,
                        src: pinIconDefine.imagePath,
                        color: pinColor,
                        opacity: param.opacity,
                        scale,
                    }),
                    zIndex,
                });
                // 白丸
                const style2 =  new Style({
                    image : new Circle({
                        radius: param.iconDefine.isSystemIcon ? 20 : 30,
                        fill: new Fill({
                                color: param.color ?? '#ffffff',
                        }),
                        displacement: [0, 84],
                        scale,
                    }),
                    zIndex,
                });
                if (param.iconDefine.id === 'default') {
                    return [style1, style2];
                }
                // 画像
                const style3 =  new Style({
                    image: new Icon({
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction', //IconAnchorUnits.FRACTION,
                        anchorYUnits: 'fraction', //IconAnchorUnits.FRACTION,
                        src: param.iconDefine.imagePath,
                        opacity: param.opacity,
                        scale: scale * 0.3,
                        displacement: [0, 210],
                    }),
                    zIndex,
                });
                return [style1, style2, style3]

            }

        }, [getZindex])
    )

    /**
     * the style function for drawing.
     * 描画時に使用するスタイル
     * @params iconDefine {IconDefine} the drawing icon. 描画に使うアイコン
     */
    const getDrawingStructureStyleFunction = useCallback((iconDefine: SystemIconDefine) => {
        return (feature: FeatureLike, resolution: number) => {
            return _createStyle({
                feature: feature as Feature<Geometry>,
                resolution,
                iconDefine,
            });

        };
    }, [_createStyle]);

    type AnalysisResult = {
        mainFeature: FeatureLike;
        showFeaturesLength: number;
    }
    /**
     * 複数重なっているPointのうち、アイコン表示させるものを返す
     */
    const _analysisFeatures = useCallback((feature: FeatureLike): AnalysisResult => {
        const features = feature.get('features') as FeatureLike[];

        if (!features) {
            return {
                mainFeature: feature,
                showFeaturesLength: 1,
            }
        }

        let showFeaturesLength = features.length;
        if (filteredItemIdList && features.length > 1) {
            const filteredFeature = features.filter(feature => {
                const exist = filteredItemIdList.some(itemId => {
                    const id = convertDataIdFromFeatureId(feature.getId() as string);
                    return isEqualId(id, itemId);
                });
                return exist;
            });
            showFeaturesLength = filteredFeature.length;
        }

        // 優先1. 選択状態のもの
        if (selectedItemId) {
            const selected = features.find(f => {
                const id = convertDataIdFromFeatureId(f.getId() as string);
                return isEqualId(selectedItemId, id);
            });
            if (selected) {
                return {
                    mainFeature: selected,
                    showFeaturesLength,
                }
            }
        }
        
        // 優先2. フィルタがかかっている場合は、フィルタ条件に該当するもの
        if (filteredItemIdList && features.length > 1) {
            let mainFeature;
            const filteredFeature = features.filter(feature => {
                const exist = filteredItemIdList.some(itemId => {
                    const id = convertDataIdFromFeatureId(feature.getId() as string);
                    return isEqualId(id, itemId);
                });
                return exist;
            });
            if (filteredFeature.length > 0) {
                mainFeature = filteredFeature[0]
            }
            return {
                mainFeature: mainFeature ?? features[0],
                showFeaturesLength,
            }
        }

        // 優先3. 冒頭のもの
        return {
            mainFeature: features[0],
            showFeaturesLength: features.length,
        };

    }, [filteredItemIdList, selectedItemId]);

    const [ dataSources ] = useAtom(itemDataSourcesAtom);
    const _createPointStyle = useCallback((feature: Feature<Geometry>, resolution: number, forceColor?: string): Style | Style[] => {
        const { mainFeature, showFeaturesLength } = _analysisFeatures(feature);

        let icon = mainFeature.getProperties().icon as IconKey | undefined;
        const itemId = convertDataIdFromFeatureId(mainFeature.getId() as string);
        if (!icon) {
            // icon未指定の場合はレイヤデフォルトアイコンを設定
            const datasource = dataSources.find(ds => ds.datasourceId === itemId.dataSourceId);
            if (datasource?.config.kind === DatasourceKindType.RealPointContent) {
                icon = datasource.config.defaultIcon;
            }
        }
        const iconDefine = getIconDefine(icon);

        // 色設定
        let color: string | undefined;
        let opacity = 1;
        let visible = true;

        if (forceColor) {
            color = forceColor;

        } else {
            // -- フィルタ状態に応じて色設定
            color = getForceColor(mainFeature);
            const tempOpacity = getOpacity(mainFeature);
            if (tempOpacity === 0) {
                visible = false;
            } else {
                opacity = tempOpacity;
            }
        }

        if (!visible) {
            return new Style();
        }

        const style = _createStyle({
            feature,
            resolution,
            iconDefine,
            color,
            opacity,
        });

        if (showFeaturesLength > 1) {
            // 複数アイテムがまとまっている場合、まとまっている数を表示
            if (Array.isArray(style)) {
                setClusterLabel(style[0], showFeaturesLength);

            } else {
                setClusterLabel(style, showFeaturesLength);

            }

        } else if (!disabledLabel) {
            // ラベル設定
            const text = createItemNameLabel(mainFeature, resolution, opacity);
            if (Array.isArray(style)) {
                style[0].setText(text);
            } else {
                style.setText(text);
            }
        }
        return style;

    }, [getOpacity, dataSources, disabledLabel, _createStyle, getForceColor, _analysisFeatures, getIconDefine]);

    /**
     * the style function for ordinaly.
     * 通常時に使用するスタイル
     */
    const pointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style | Style[] => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution);

        return style;

    }, [_createPointStyle]);

    const selectedStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style | Style[] => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution, STRUCTURE_SELECTED_COLOR);

        return style;
    }, [_createPointStyle]);

    return {
        getDrawingStructureStyleFunction,
        pointStyleFunction,
        selectedStyleFunction,
    }
}

/**
 * 建物名ラベルを生成して返す
 * @param feature 
 */
function createItemNameLabel(feature: FeatureLike, resolution: number, opacity: number): Text {
    // ラベル設定
    let name = (feature.getProperties().name ?? '') as string;
    if (name.length > MapStyles.Item.maxLabelLength) {
        // 折り返す
        name = splitString(name, MapStyles.Item.maxLabelLength).join('\n');
    }

    const scale = Math.min(0.002 * (1 / resolution), 1);
    const color = '#000000' + Math.floor(255 * opacity).toString(16);

    const text = new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        text: name,
        overflow: true,
        backgroundFill: new Fill({ color: '#fffa' }),
        fill: new Fill({ color }),
        font: `${scale}rem Calibri,sans-serif`,
    });

    return text;
}

/**
 * 文字列を指定の文字数で分割
 * @param inputString 
 * @param chunkSize 
 * @returns 
 */
function splitString(inputString: string, chunkSize: number) {
    const resultArray: string[] = [];
    for (let index = 0; index < inputString.length; index+=chunkSize) {
      resultArray.push(inputString.substring(index, index + chunkSize));
    }
    return resultArray;
}

function setClusterLabel(style: Style, size: number) {
    const imageSize = style.getImage().getImageSize();
    const scale = style.getImage().getScale() as number;
    const offsetY = imageSize ? - (imageSize[1] / 1.65 * scale) : 0;
    const text = new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        offsetY,
        text: size + '',
        overflow: true,
        // TODO: アイコン画像によって、背景色があった方がいいケースとない方がいいケースがあるので、対応策考える。
        // backgroundFill: new Fill({ color: '#ffffffaa' }),
        font: '.6rem Calibri,sans-serif',
        padding: [0, 1, 0, 1],
        scale: 1.2,
    });
    style.setText(text);
}

function paraseRgb(hexColor: string) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    return {r, g, b}
}

function decimalToHex(decimalValue: number) {
    // 255を超える場合は255に丸める
    const clampedValue = Math.min(decimalValue, 255);
    // 16進数に変換して返す
    return clampedValue.toString(16).padStart(2, '0');
}

function multipleColor(color1: string, color2: string) {
    const rgb1 = paraseRgb(color1);
    const rgb2 = paraseRgb(color2);

    // 乗算した色を計算
    const newColor = {
        r: Math.min(Math.round(rgb1.r * rgb2.r / 255), 255),
        g: Math.min(Math.round(rgb1.g * rgb2.g / 255), 255),
        b: Math.min(Math.round(rgb1.b * rgb2.b / 255), 255)
    };

    const redHex = decimalToHex(newColor.r);
    const greenHex = decimalToHex(newColor.g);
    const blueHex = decimalToHex(newColor.b);
    return `#${redHex}${greenHex}${blueHex}`;
}
