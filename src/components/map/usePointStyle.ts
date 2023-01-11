import useIcon from "../../store/useIcon";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Feature, { FeatureLike } from "ol/Feature";
import { Fill, Icon, Style, Text } from 'ol/style';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { getStructureScale } from "../../util/MapUtility";
import { MapMode, SystemIconDefine } from "../../types/types";
import useFilterStatus from "./useFilterStatus";
import { useFilter } from "../../store/useFilter";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";
import { IconInfo } from "279map-common";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";

// 建物ラベルを表示するresolution境界値（これ以下の値の時に表示）
const StructureLabelResolution = 0.003;

type Props = {
    structureLayer: VectorLayer<VectorSource>; // 建物レイヤ
}

/**
 * 建物・地点に関するスタイルを設定するフック
 * @param props 
 * @returns 
 */
export default function usePointStyle(props: Props) {
    const { getForceColor, getFilterStatus } = useFilterStatus();
    const { filteredItemIdList } = useFilter();
    const ownerContext = useContext(OwnerContext);
    const iconHook = useIcon();
    const mapMode = useSelector((state: RootState) => state.operation.mapMode);
    const selectedFeatureRef = useRef<Feature>();

    const getZindex = useCallback((feature: FeatureLike): number => {
        const pointsSource = props.structureLayer.getSource();
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

    const createStyle = useCallback((param: {iconDefine: SystemIconDefine; feature: FeatureLike; resolution: number; color?: string; opacity?: number}) => {
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
            return createStyle({
                feature,
                resolution,
                iconDefine,
            });

        };
    }, [createStyle]);

    type AnalysisResult = {
        mainFeature: FeatureLike;
        showFeaturesLength: number;
    }
    /**
     * 複数重なっているPointのうち、アイコン表示させるものを返す
     */
    const analysisFeatures = useCallback((feature: FeatureLike): AnalysisResult => {
        const features = feature.get('features') as FeatureLike[];
        if (!features) {
            return {
                mainFeature: feature,
                showFeaturesLength: 1,
            }
        }
        // 優先1. 選択状態のもの
        
        // 優先2. フィルタがかかっている場合は、フィルタ条件に該当するもの
        if (filteredItemIdList && features.length > 1) {
            let mainFeature;
            const filteredFeature = features.filter(feature => filteredItemIdList.includes(feature.getId() as string));
            if (filteredFeature.length > 0) {
                mainFeature = filteredFeature[0]
            }
            return {
                mainFeature: mainFeature ?? features[0],
                showFeaturesLength: filteredFeature.length,
            }
        }

        // 優先3. 冒頭のもの
        return {
            mainFeature: features[0],
            showFeaturesLength: features.length,
        };

    }, [filteredItemIdList]);

    /**
     * the style function for ordinaly.
     * 通常時に使用するスタイル
     */
    const pointStyleFunction = useCallback((feature: FeatureLike, resolution: number): Style => {
        // console.log('pointStyleFunction', features);

        const { mainFeature, showFeaturesLength } = analysisFeatures(feature);

        const icon = mainFeature.getProperties().icon as IconInfo | undefined;
        const iconDefine = iconHook.getIconDefine(icon);

        // 色設定
        let color: string | undefined;
        let opacity = 1;
        // const selected = mainFeature === selectedFeatureRef.current;
        const selected = mainFeature.getProperties().selected;
        if (selected) {
            // -- 選択状態の場合
            color = '#8888ff';
        } else {
            // -- フィルタ状態に応じて色設定
            color = getForceColor(mainFeature);
            const filterStatus = getFilterStatus(mainFeature);
            opacity = filterStatus.status === 'UnFiltered' ? 0.3 : 1;

        }

        const style = createStyle({
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

    }, [ownerContext.disabledLabel, createStyle, getFilterStatus, getForceColor, iconHook, analysisFeatures]);

    useEffect(() => {
        if (mapMode === MapMode.Normal)
            props.structureLayer.setStyle(pointStyleFunction);
    }, [pointStyleFunction, props.structureLayer, mapMode]);

    const setSelectedFeature = useCallback((feature: Feature | undefined) => {
        selectedFeatureRef.current = feature;
    }, []);

    return {
        getDrawingStructureStyleFunction,
        setSelectedFeature,
        pointStyleFunction,
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
    const offsetY = imageSize ? - (imageSize[1] / 1.6 * scale) : 0;
    const text = new Text({
        textAlign: 'center',
        textBaseline: 'middle',
        offsetY,
        text: size + '',
        overflow: true,
        backgroundFill: new Fill({ color: '#ffffffff' }),
        font: '1rem Calibri,sans-serif',
        padding: [0, 5, 0, 5],
        scale: 1.2,
    });
    style.setText(text);
}