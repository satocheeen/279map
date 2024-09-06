import { useCallback, useMemo } from "react";
import Feature, { FeatureLike } from "ol/Feature";
import { Fill, Icon, Style, Text } from 'ol/style';
import { getOpacityValue, getStructureScale } from "../../util/MapUtility";
import useFilterStatus, { Opacity } from "./useFilterStatus";
import { Geometry } from "ol/geom";
import { useMapOptions } from "../../util/useMapOptions";
import { selectItemIdAtom } from "../../store/operation";
import useIcon from "../../store/icon/useIcon";
import { filteredItemIdListAtom } from "../../store/filter";
import { itemDataSourcesAtom } from "../../store/datasource";
import { useAtom } from 'jotai';
import { MapStyles } from "../../util/constant-defines";
import { DataId, DatasourceLocationKindType, IconKey } from "../../types-common/common-types";
import { useAtomCallback } from "jotai/utils";
import { currentMapKindAtom } from "../../store/session";
import { ItemInfo, MapKind, SystemIconDefine } from "../../entry";
import { addFillStyle, currentDefaultIconAtom } from "../../store/icon";
import { allItemsAtom } from "../../store/item";
import { ColorPattern, FeatureColor } from "./types";
import { StyleKey } from "./PointStyleMap";
import { useMap } from "./useMap";

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
    const [ selectedItemId ] = useAtom(selectItemIdAtom);
    const [ allItems ] = useAtom(allItemsAtom);
    const { map } = useMap();

    /**
     * @return key = featureId, value = zIndex のマップ
     */
    const zIndexMap = useMemo(() => {
        // 地図上でのY座標順にソート
        const sortedItems = allItems.sort((a, b) => {
            const getWeight = function(item: ItemInfo) {
                if (item.geometry.type === 'Point') {
                    return item.geometry.coordinates[1];
                } else {
                    return 0;
                }
            }
            const aWeight = getWeight(a);
            const bWeight = getWeight(b);
            return (aWeight - bWeight) * -1;
        });
        const map = {} as {[id: DataId]: number};
        sortedItems.forEach((item, index) => {
            map[item.id] = index;
        })
        return map;

    }, [allItems]);

    const _createStyle = useAtomCallback(
        useCallback((get, set, param: {iconDefine: SystemIconDefine; resolution: number; color?: FeatureColor; opacity?: Opacity}) => {
            const mapKind = get(currentMapKindAtom);

            const scale = getStructureScale(param.resolution, mapKind);

            const opacity = getOpacityValue(param.opacity);

            const styleKey: StyleKey = {
                iconKey: {
                    id: param.iconDefine.id,
                    type: param.iconDefine.type
                },
                color: param.color,
                opacity: param.opacity,
            };
            const style = map?.pointStyleMap.get(styleKey);
            if (style) {
                style.getImage().setScale(scale);
                return style;
            }

            const newStyle = function() {
                if (mapKind === MapKind.Virtual) {
                    return new Style({
                        image: new Icon({
                            anchor: [0.5, 1],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            src: param.iconDefine?.imagePath,
                            color: param.color ? ColorPattern[param.color] : undefined,
                            opacity,
                            scale,
                        }),
                    });
    
                } else {
                    const { src, color } = function() {
                        if (param.color && param.iconDefine.originalSvgData) {
                            const forceData = addFillStyle(param.iconDefine.originalSvgData, ColorPattern[param.color], 'my-color')
                            return {
                                src: 'data:image/svg+xml;utf8,' + forceData,
                                color: undefined,
                            }
                        } else {
                            return {
                                src: param.iconDefine.imagePath,
                                color: param.color ? ColorPattern[param.color] : undefined,
                            }
                        }
        
                    }();
                    
                    return new Style({
                        image: new Icon({
                            anchor: [0.5, 1],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction',
                            src,
                            color,
                            opacity,
                            scale,
                        }),
                    });
                }
            }();

            map?.pointStyleMap.set(styleKey, newStyle);
            return newStyle;

        }, [map])
    )

    /**
     * the style function for drawing.
     * 描画時に使用するスタイル
     * @params iconDefine {IconDefine} the drawing icon. 描画に使うアイコン
     */
    const getDrawingStructureStyleFunction = useCallback((iconDefine: SystemIconDefine) => {
        return (feature: FeatureLike, resolution: number) => {
            return _createStyle({
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
                    const id = feature.getId() as DataId;
                    return id === itemId;
                });
                return exist;
            });
            showFeaturesLength = filteredFeature.length;
        }

        // 優先1. 選択状態のもの
        if (selectedItemId) {
            const selected = features.find(f => {
                const id = f.getId() as DataId;
                return selectedItemId === id;
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
                    const id = feature.getId() as DataId;
                    return id === itemId;
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
    const _createPointStyle = useAtomCallback(
        useCallback((get, set, feature: Feature<Geometry>, resolution: number, forceColor?: FeatureColor, isTemporary?: boolean): Style | Style[] => {
            const { mainFeature, showFeaturesLength } = _analysisFeatures(feature);
            const allItems = get(allItemsAtom);

            console.log('_createPointStyle')

            const iconDefine = function() {
                if (isTemporary) {
                    // 一時レイヤの場合
                    const pinIconDefine = get(currentDefaultIconAtom);
                    return pinIconDefine;
                } else {
                    let icon = mainFeature.getProperties().icon as IconKey | undefined;
                    const itemId = mainFeature.getId() as DataId;
                    const item = allItems.find(i => i.id === itemId);
                    if (!icon && item) {
                        // icon未指定の場合はレイヤデフォルトアイコンを設定
                        const datasource = dataSources.find(ds => ds.datasourceId === item.datasourceId);
                        if (datasource?.config.kind === DatasourceLocationKindType.RealItem) {
                            icon = datasource.config.defaultIcon;
                        }
                    }
                    return getIconDefine(icon);
                }
            }();

            // 色設定
            let color: FeatureColor | undefined;
            let opacity = Opacity.Normal;
            let visible = true;

            if (forceColor) {
                color = forceColor;

            } else if(!isTemporary){
                // -- フィルタ状態に応じて色設定
                color = getForceColor(mainFeature);
                const tempOpacity = getOpacity(mainFeature);
                if (tempOpacity === Opacity.Hidden) {
                    visible = false;
                } else {
                    opacity = tempOpacity;
                }
            }

            if (!visible) {
                return new Style();
            }

            const style = _createStyle({
                resolution,
                iconDefine,
                color,
                opacity,
            });

            // 地図上でY座標が下のものほど手前に表示するようにする
            const zIndex = zIndexMap[mainFeature.getId() as DataId];
            style.setZIndex(zIndex);

            const text = function() {
                if (showFeaturesLength > 1) {
                    // 複数アイテムがまとまっている場合、まとまっている数を表示
                    return createStyleWithClusterLabel(style, showFeaturesLength);
    
                } else if (!disabledLabel) {
                    // ラベル設定
                    return createItemNameLabel(mainFeature, resolution, opacity);
                }
    
            }();
            return [
                style,
                new Style({
                    text,
                    zIndex: zIndex + 1,
                })
            ]

        }, [getOpacity, dataSources, disabledLabel, _createStyle, getForceColor, _analysisFeatures, getIconDefine, zIndexMap])
    )

    /**
     * the style function for ordinaly.
     * 通常時に使用するスタイル
     */
    const pointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style | Style[] => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution);

        return style;

    }, [_createPointStyle]);

    const temporaryPointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style | Style[] => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution, undefined, true);

        return style;

    }, [_createPointStyle]);

    const selectedStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style | Style[] => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution, FeatureColor.Selected);

        return style;
    }, [_createPointStyle]);

    return {
        getDrawingStructureStyleFunction,
        pointStyleFunction,
        temporaryPointStyleFunction,
        selectedStyleFunction,
    }
}

/**
 * 建物名ラベルを生成して返す
 * @param feature 
 */
function createItemNameLabel(feature: FeatureLike, resolution: number, opacity: Opacity): Text {
    // ラベル設定
    let name = (feature.getProperties().name ?? '') as string;
    if (name.length > MapStyles.Item.maxLabelLength) {
        // 折り返す
        name = splitString(name, MapStyles.Item.maxLabelLength).join('\n');
    }

    const scale = Math.min(0.002 * (1 / resolution), 1);
    const color = '#000000' + Math.floor(255 * getOpacityValue(opacity)).toString(16);

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

/**
 * 指定の数を描画したTextを生成する
 * @param style 
 * @param size 
 * @returns 
 */
function createStyleWithClusterLabel(style: Style, size: number): Text {
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
    return text;
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

