import { Feature } from 'ol';
import { Modify } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import React, { useEffect, useCallback, useRef, useState } from 'react';
import useConfirm from '../../../common/confirm/useConfirm';
import { useProcessMessage } from '../../../common/spinner/useProcessMessage';
import { createGeoJson, extractGeoProperty, getOriginalLine } from '../../../../util/MapUtility';
import useTopographyStyle from '../../useTopographyStyle';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from '../SelectFeature';
import RoadWidthSelecter from './RoadWidthSelecter';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { convertDataIdFromFeatureId } from '../../../../util/dataUtility';
import { useMap } from '../../useMap';
import { ConfirmResult } from '../../../common/confirm/types';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';
import { FeatureType, GeoProperties, UpdateItemDocument } from '../../../../graphql/generated/graphql';

type Props = {
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
    const { map } = useMap();
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    const selectedFeature = useRef<FeatureLike>();
    const styleHook = useTopographyStyle({});
    const confirmHook = useConfirm();
    const spinnerHook = useProcessMessage();
    const modifySource = useRef<VectorSource|null>();
    const modify = useRef<Modify>();

    /**
     * 初期化
     */
    useEffect(() => {
        if (!map) return;
        const style = styleHook.getStyleFunction(() => {
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
        });
        const modifyLayer = map.createDrawingLayer(style);
        modifySource.current = modifyLayer.getSource();
        modify.current = new Modify({
            source: modifyLayer.getSource() as VectorSource,
        });

        return () => {
            map.removeDrawingLayer(modifyLayer);
            modifySource.current?.clear();
            if (modify.current)
                map.removeInteraction(modify.current);
        }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    const onSelectFeature = useCallback((feature: FeatureLike) => {
        console.log('select feature', feature);
        selectedFeature.current = feature;

        // 対象図形のソースを編集用ソースにコピー
        let editFeature: Feature;
        if ((feature.getProperties() as GeoProperties).__typename === 'RoadProperties') {
            // 道の場合は、ラインに変換する
            editFeature = getOriginalLine(feature as Feature<Geometry>);
        } else {
            editFeature = (feature as Feature<Geometry>).clone();
        }
        modifySource.current?.addFeature(editFeature);
        // 編集インタラクションOn
        if (modify.current)
            map?.addInteraction(modify.current);

        setStage(Stage.EDITING);
    }, [map]);

    const onClose = useCallback(() => {
        props.close();
    }, [props]);

    const [ gqlClient ] = useAtom(clientAtom);

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

        // 更新
        const h = spinnerHook.showProcessMessage({
            overlay: true,
            spinner: true,
            message: '更新中...'
        });

        const geoProperties = extractGeoProperty(feature.getProperties());
        const geoJson = geoProperties.__typename === 'RoadProperties' ? geoProperties.lineJson : createGeoJson(feature);
        const id = convertDataIdFromFeatureId(selectedFeature.current?.getId() as string);
        await gqlClient.mutation(UpdateItemDocument, {
            targets: [
                {
                    id,
                    geometry: geoJson.geometry,
                    geoProperties: extractGeoProperty(geoJson.properties),
                }
            ]
        });

        spinnerHook.hideProcessMessage(h);

        onClose();

    }, [onClose, confirmHook, gqlClient, spinnerHook]);

    const onEditOkClicked = useCallback(() => {
        if ((selectedFeature.current?.getProperties() as GeoProperties).__typename === 'RoadProperties') {
            setStage(Stage.SELECT_ROAD_WIDTH);
        } else {
            const feature = modifySource.current?.getFeatures()[0];
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
            targetType={LayerType.Topography}
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
        const target = modifySource.current?.getFeatures()[0] as Feature;
        return (
            <RoadWidthSelecter targetRoad={target} onOk={onWidthSelected} onCancel={onClose} />
        );
    }
}