import { Feature, Map } from 'ol';
import { Modify } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import React, { useCallback, useRef, useState } from 'react';
import useConfirm, { ConfirmResult } from '../../../common/confirm/useConfirm';
import { useSpinner } from '../../../common/spinner/useSpinner';
import { createGeoJson, extractGeoProperty, getOriginalLine } from '../../../../util/MapUtility';
import useTopographyStyle from '../../useTopographyStyle';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from '../SelectFeature';
import RoadWidthSelecter from './RoadWidthSelecter';
import { useAppDispatch } from '../../../../store/configureStore';
import { updateFeature } from '../../../../store/data/dataThunk';
import { FeatureType, GeoProperties } from '../../../../279map-common';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';

type Props = {
    map: Map;   // コントロール対象の地図
    close: () => void;  // 作図完了時のコールバック
}

enum Stage {
    SELECTING_FEATURE,
    EDITING,
    SELECT_ROAD_WIDTH,  // 道幅選択（道編集の場合のみ）
}

/**
 * 地形編集用コントロールクラス
 */
 export default function EditTopographyController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    const selectedFeature = useRef<FeatureLike>();
    const styleHook = useTopographyStyle({});
    const modifyLayer = useRef(new VectorLayer({
        source: new VectorSource(),
        style: styleHook.getStyleFunction(() => {
            return new Style({
                // fill: new Fill({
                //     color: 'rgba(255, 255, 255, 0.2)'
                // }),
                // 道Line
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                // image: new CircleStyle({
                //     radius: 7,
                //     fill: new Fill({
                //         color: '#ffcc33'
                //     })
                // })
            })
        }),
        zIndex: 2,
    }));
    const modify = useRef(new Modify({
        source: modifyLayer.current.getSource() as VectorSource,
    }));
    const confirmHook = useConfirm();
    const dispatch = useAppDispatch();
    const spinnerHook = useSpinner();

    const onSelectFeature = useCallback((feature: FeatureLike) => {
        console.log('select feature', feature);
        selectedFeature.current = feature;

        // 対象図形のソースを編集用ソースにコピー
        let editFeature: Feature;
        if ((feature.getProperties() as GeoProperties).featureType === FeatureType.ROAD) {
            // 道の場合は、ラインに変換する
            editFeature = getOriginalLine(feature as Feature<Geometry>);
        } else {
            editFeature = (feature as Feature<Geometry>).clone();
        }
        modifyLayer.current.getSource()?.addFeature(editFeature);
        props.map.addLayer(modifyLayer.current);
        // 編集インタラクションOn
        props.map.addInteraction(modify.current);

        setStage(Stage.EDITING);
    }, [props.map]);

    const onClose = useCallback(() => {
        modifyLayer.current.getSource()?.clear();
        props.map.removeLayer(modifyLayer.current);
        props.map.removeInteraction(modify.current);
        props.close();
    }, [props]);

    /**
     * 変更後Featureを保存する
     * @param feature 変更後Feature
     */
    const onSave = useCallback(async(feature: Feature) => {
        const result = await confirmHook.confirm({
            message: '変更を確定してよろしいですか。',
        });
        if(result === ConfirmResult.Cancel) {
            onClose();
        }

        // Notion更新
        spinnerHook.showSpinner('更新中...');

        const geoProperties = extractGeoProperty(feature.getProperties());
        const geoJson = geoProperties.featureType === FeatureType.ROAD ? geoProperties.lineJson : createGeoJson(feature);
        await dispatch(updateFeature({
            // TODO: data_source_id考慮
            id: {
                id: selectedFeature.current?.getId() as string,
                dataSourceId: '',
            },
            geometry: geoJson.geometry,
            geoProperties: extractGeoProperty(geoJson.properties),
        }));

        spinnerHook.hideSpinner();

        onClose();

    }, [onClose, confirmHook, dispatch, spinnerHook]);

    const onEditOkClicked = useCallback(() => {
        if ((selectedFeature.current?.getProperties() as GeoProperties).featureType === FeatureType.ROAD) {
            setStage(Stage.SELECT_ROAD_WIDTH);
        } else {
            const feature = modifyLayer.current.getSource()?.getFeatures()[0];
            if (!feature) {
                console.warn('対象なし');
                return;
            }
            onSave(feature);
        }
    }, [onSave]);

    const onWidthSelected = useCallback((feature: Feature) => {
        onSave(feature);
    }, [onSave]);

    if (stage === Stage.SELECTING_FEATURE) {
        return (
            <SelectFeature
            map={props.map}
            target="topography"
            onOk={onSelectFeature} onCancel={onClose} />
        )
    } else if (stage === Stage.EDITING) {
        return (
            <PromptMessageBox 
                message={'編集完了したら、完了ボタンを押下してください。'} 
                ok={onEditOkClicked} 
                cancel={onClose} 
                okname="完了" />
        );
    } else {
        const target = modifyLayer.current.getSource()?.getFeatures()[0] as Feature;
        return (
            <RoadWidthSelecter map={props.map} targetRoad={target} onOk={onWidthSelected} onCancel={onClose} />
        );
    }
}