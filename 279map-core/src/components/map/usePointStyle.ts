import useIcon from "../../store/useIcon";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Feature, { FeatureLike } from "ol/Feature";
import { Fill, Icon, Style, Text } from 'ol/style';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { getStructureScale } from "../../util/MapUtility";
import { MapMode, SystemIconDefine } from "../../types/types";
import useFilterStatus from "./useFilterStatus";
import { useFilter } from "../../store/useFilter";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";
import { IconInfo } from "../../279map-common";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import { LayerStyle, VectorLayerMap } from "../TsunaguMap/VectorLayerMap";
import { Geometry } from "ol/geom";
import { MapChartContext } from "../TsunaguMap/MapChart";

// 建物ラベルを表示するresolution境界値（これ以下の値の時に表示）
const StructureLabelResolution = 0.003;

const STRUCTURE_SELECTED_COLOR = '#8888ff';

/**
 * 建物・地点に関するスタイルを設定するフック
 * @param props 
 * @returns 
 */
export default function usePointStyle() {
    const { map } = useContext(MapChartContext);
    const { getForceColor, getFilterStatus } = useFilterStatus();
    const { filteredItemIdList } = useFilter();
    const ownerContext = useContext(OwnerContext);
    const iconHook = useIcon();
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);

    const getZindex = useCallback((feature: Feature<Geometry>): number => {
        // featureが属するレイヤソース取得
        const pointsSource = map.getSourceContainedTheFeature(feature);
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
    }, []);

    const _createStyle = useCallback((param: {iconDefine: SystemIconDefine; feature: Feature<Geometry>; resolution: number; color?: string; opacity?: number}) => {
        const type = param.feature.getGeometry()?.getType();
        if (type !== 'Point') {
            console.warn('geometry type is not point', param.feature);
            return new Style();
        }
        const scale = getStructureScale(param.resolution);
        // 地図上でY座標が下のものほど手前に表示するようにする
        const zIndex = getZindex(param.feature);

        return new Style({
            image: new Icon({
                anchor: [0.5, 1],
                anchorXUnits: 'fraction', //IconAnchorUnits.FRACTION,
                anchorYUnits: 'fraction', //IconAnchorUnits.FRACTION,
                src: param.iconDefine.imagePath,
                color: param.color ?? param.iconDefine.defaultColor,
                opacity: param.opacity,
                scale,
            }),
            zIndex,
        });
    }, [getZindex]);

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
            const filteredFeature = features.filter(feature => filteredItemIdList.includes(feature.getId() as string));
            showFeaturesLength = filteredFeature.length;
        }

        // console.log('analysisFeatures', selectedFeatureRef.current);
        // 優先1. 選択状態のもの
        // if (selectedFeatureRef.current) {
        //     const selected = features.find(f => f === selectedFeatureRef.current);
        //     console.log('selected', selected);
        //     if (selected) {
        //         return {
        //             mainFeature: selected,
        //             showFeaturesLength,
        //         }
        //     }
        // }
        
        // 優先2. フィルタがかかっている場合は、フィルタ条件に該当するもの
        if (filteredItemIdList && features.length > 1) {
            let mainFeature;
            const filteredFeature = features.filter(feature => filteredItemIdList.includes(feature.getId() as string));
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

    }, [filteredItemIdList]);

    const _createPointStyle = useCallback((feature: Feature<Geometry>, resolution: number, forceColor?: string): Style => {
        const { mainFeature, showFeaturesLength } = _analysisFeatures(feature);

        const icon = mainFeature.getProperties().icon as IconInfo | undefined;
        const iconDefine = iconHook.getIconDefine(icon);

        // 色設定
        let color: string | undefined;
        let opacity = 1;

        if (forceColor) {
            color = forceColor;

        } else {
            // -- フィルタ状態に応じて色設定
            color = getForceColor(mainFeature);
            const filterStatus = getFilterStatus(mainFeature);
            opacity = filterStatus.status === 'UnFiltered' ? 0.3 : 1;

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
            setClusterLabel(style, showFeaturesLength);

        } else if (!ownerContext.disabledLabel && resolution <= StructureLabelResolution) {
            // ラベル設定
            const text = createItemNameLabel(mainFeature);
            style.setText(text);
        }
        return style;

    }, [ownerContext.disabledLabel, _createStyle, getFilterStatus, getForceColor, _analysisFeatures, iconHook]);

    /**
     * the style function for ordinaly.
     * 通常時に使用するスタイル
     */
    const pointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution);

        return style;

    }, [_createPointStyle]);

    const selectedStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        const style = _createPointStyle(feature as Feature<Geometry>, resolution, STRUCTURE_SELECTED_COLOR);

        return style;
    }, [_createPointStyle]);

    useEffect(() => {
        if (mapMode === MapMode.Normal) {
            map.setPointLayerStyle(pointStyleFunction);
        }
    }, [pointStyleFunction, mapMode]);

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
function createItemNameLabel(feature: FeatureLike): Text {
    // ラベル設定
    let name = feature.getProperties().name;
    if (name === undefined) {
        name = '';
    }

    const text = new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        text: name,
        overflow: true,
        backgroundFill: new Fill({ color: '#ffffffaa' }),
        font: '1rem Calibri,sans-serif',
    });

    return text;
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