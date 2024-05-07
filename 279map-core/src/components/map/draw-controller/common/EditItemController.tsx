import { Feature } from 'ol';
import { Modify } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import React, { useEffect, useCallback, useRef, useState } from 'react';
import useConfirm from '../../../common/confirm/useConfirm';
import { createGeoJson, extractGeoProperty, getOriginalLine } from '../../../../util/MapUtility';
import useTopographyStyle from '../../useTopographyStyle';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from './SelectFeature';
import RoadWidthSelecter from '../topography/RoadWidthSelecter';
import { Geometry } from 'ol/geom';
import { convertDataIdFromFeatureId } from '../../../../util/dataUtility';
import { useMap } from '../../useMap';
import { ConfirmResult } from '../../../common/confirm/types';
import { FeatureType, GeoProperties } from '../../../../types-common/common-types';
import useItemProcess from '../../../../store/item/useItemProcess';
import SelectStructureDialog from '../structure/SelectStructureDialog';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { SystemIconDefine } from '../../../../store/icon';

type Props = {
    target: FeatureType[];
    close: () => void;  // 作図完了時のコールバック
}

enum Stage {
    SELECTING_FEATURE,  // 編集対象選択中

    // ピン、建物の場合
    SELECTING_STRUCTURE,    // 改築後の建物選択中

    // エリア、土地などの場合
    EDITING,
    SELECT_ROAD_WIDTH,  // 道幅選択（道編集の場合のみ）
}

/**
 * アイテム編集用コントロールクラス
 */
 export default function EditItemController(props: Props) {
    const { map } = useMap();
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    const selectedFeature = useRef<Feature<Geometry>>();
    const { getStyleFunction } = useTopographyStyle({});
    const confirmHook = useConfirm();
    const modifySource = useRef<VectorSource|null>();
    const modify = useRef<Modify>();

    /**
     * 初期化
     */
    useEffect(() => {
        if (!map) return;
        const style = getStyleFunction(() => {
            return new Style({
                // 道Line
                stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
            })
        });
        const modifyLayer = map.createDrawingLayer(LayerType.Topography, style);
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
    
    }, [map, getStyleFunction]);

    const onSelectFeature = useCallback((feature: Feature<Geometry>) => {
        selectedFeature.current = feature;

        const featureType = (feature.getProperties() as GeoProperties).featureType;

        if (featureType === FeatureType.STRUCTURE) {
            setStage(Stage.SELECTING_STRUCTURE);

        } else {
            // 対象図形のソースを編集用ソースにコピー
            let editFeature: Feature;
            if (featureType === FeatureType.ROAD) {
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
        }

    }, [map]);

    const onClose = useCallback(() => {
        props.close();
    }, [props]);

    const { updateItems } = useItemProcess();

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
        const geoProperties = extractGeoProperty(feature.getProperties());
        const geoJson = geoProperties.featureType === FeatureType.ROAD ? geoProperties.lineJson : createGeoJson(feature);
        const id = convertDataIdFromFeatureId(selectedFeature.current?.getId() as string);
        updateItems([
            {
                id,
                geometry: geoJson.geometry,
                geoProperties: extractGeoProperty(geoJson.properties),
            }
        ])

        onClose();

    }, [onClose, confirmHook, updateItems]);

    const onSelectedStructure = useCallback(async(iconDefine: SystemIconDefine) => {
        if (!selectedFeature.current) {
            console.warn('選択アイテムなし');
            return;
        }

        const geoJson = createGeoJson(selectedFeature.current);

        // update DB
        const id = convertDataIdFromFeatureId(selectedFeature.current.getId() as string);
        updateItems([
            {
                id,
                geometry: geoJson.geometry,
                geoProperties: {
                    featureType: FeatureType.STRUCTURE,
                    icon: {
                        type: iconDefine.type,
                        id: iconDefine.id,
                    },
                },
            }
        ])

        props.close();
    }, [selectedFeature, props, updateItems]);
    
    const onEditOkClicked = useCallback(() => {
        if ((selectedFeature.current?.getProperties() as GeoProperties).featureType === FeatureType.ROAD) {
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

    switch(stage) {
        case Stage.SELECTING_FEATURE:
            return (
                <SelectFeature
                featureType={props.target}
                onOk={onSelectFeature} onCancel={onClose} />
            )

        case Stage.EDITING:
            return (
                <PromptMessageBox 
                    message={'編集完了したら、完了ボタンを押下してください。\n※ポイント削除したい場合→>Altボタンを押しながらクリック'} 
                    ok={onEditOkClicked} 
                    cancel={onClose} 
                    okname="完了" />
            );

        case Stage.SELECT_ROAD_WIDTH:
            const target = modifySource.current?.getFeatures()[0] as Feature;
            return (
                <RoadWidthSelecter targetRoad={target} onOk={onWidthSelected} onCancel={onClose} />
            );

        case Stage.SELECTING_STRUCTURE:
            return (
                <SelectStructureDialog ok={onSelectedStructure} cancel={onClose} />
            );
    
    }
}