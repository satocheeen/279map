import React, { useCallback, useState } from 'react';
import * as MapUtility from '../../../../util/MapUtility';
import PromptMessageBox from '../PromptMessageBox';
import SelectDrawFeature, { DrawFeatureType } from './SelectDrawFeature';
import DrawPointRadius from './DrawPointRadius';
import { DrawAreaAddress } from './DrawAreaAddress';
import { DrawFreeArea } from './DrawFreeArea';
import { Geometry } from 'ol/geom';
import { Feature } from 'ol';
import { FeatureType, GeoProperties } from '../../../../types-common/common-types';
import useItemProcess from '../../../../store/item/useItemProcess';

type Props = {
    dataSourceId: string;
    drawFeatureType: FeatureType.EARTH | FeatureType.FOREST | FeatureType.AREA;
    close: () => void;  // 作図完了時のコールバック
}

// 描画状況
enum Stage {
    SELECTING_FEATURE,

    // 多角形 or 円描画
    FREE_DRAWING,

    // 住所検索
    SEARCH_AREA_ADDRESS, 
    SEARCH_POINT_ADDRESS, 
}

/**
 * 島、緑地の作図コントローラ
 */
export default function DrawTopographyController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);

    const [geometryType, setGeometryType] = useState('Polygon');

    const { registItem } = useItemProcess();

    const registFeatureFunc = useCallback(async(feature: Feature<Geometry>) => {
        // DB登録
        // const feature = map.getDrawingLayer().getSource()?.getFeatures()[0];
        if (!feature) {
            console.warn('feature not find.')
        } else {
            const geoJson = MapUtility.createGeoJson(feature);

            registItem({
                datasourceId: props.dataSourceId,
                geometry: geoJson.geometry,
                geoProperties: Object.assign({}, geoJson.properties, {
                    featureType: props.drawFeatureType,
                } as GeoProperties),
            });
        }

        props.close();
    }, [props, registItem]);

    // 描画図形選択後
    const onSelectDrawFeatureType = useCallback((selected: DrawFeatureType) => {
        switch(selected) {
            case DrawFeatureType.FreePolygon:
                setGeometryType('Polygon');
                setStage(Stage.FREE_DRAWING);
                break;
            case DrawFeatureType.FreeCircle:
                setGeometryType('Circle');
                setStage(Stage.FREE_DRAWING);
                break;
            case DrawFeatureType.AddressArea:
                setStage(Stage.SEARCH_AREA_ADDRESS);
                break;
            case DrawFeatureType.AddressPointRadius:
                setStage(Stage.SEARCH_POINT_ADDRESS);
                break;
        }
    }, []);
    

    const onSelectFeatureCanceled = () => {
        props.close();
    }

    const onDrawCanceled = useCallback(() => {
        setStage(Stage.SELECTING_FEATURE);
    }, []);

    switch(stage) {
        case Stage.SELECTING_FEATURE:
            return (
                <PromptMessageBox message='作図方法を選んでください.'
                    cancel={onSelectFeatureCanceled}>
                    <SelectDrawFeature onSelect={onSelectDrawFeatureType} />
                </PromptMessageBox>
            );
        case Stage.FREE_DRAWING:
            return (
                <DrawFreeArea
                    geometryType={geometryType}
                    drawFeatureType={props.drawFeatureType}
                    onOk={(f) => registFeatureFunc(f)}
                    onCancel={onDrawCanceled}
                />
            );
        case Stage.SEARCH_AREA_ADDRESS:
            return (
                <DrawAreaAddress 
                    onOk={(f) => registFeatureFunc(f)}
                    onCancel={onDrawCanceled}/>
        );
        case Stage.SEARCH_POINT_ADDRESS:
            return(
                <DrawPointRadius
                    onOk={(f) => registFeatureFunc(f)}
                    onCancel={onDrawCanceled}/>
            );            
    }
}
