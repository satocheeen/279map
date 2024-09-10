import { Feature } from 'ol';
import { Modify } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import React, { useEffect, useCallback, useRef, useState } from 'react';
import useConfirm from '../../../common/confirm/useConfirm';
import { createGeoJson, extractGeoProperty, GeoPropertiesForCore, getOriginalLine } from '../../../../util/MapUtility';
import useTopographyStyle from '../../useTopographyStyle';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from './SelectFeature';
import RoadWidthSelecter from '../topography/RoadWidthSelecter';
import { Geometry } from 'ol/geom';
import { useMap } from '../../useMap';
import { ConfirmBtnPattern, ConfirmResult } from '../../../common/confirm/types';
import { DataId, FeatureType, GeoProperties, IconKey } from '../../../../types-common/common-types';
import useItemProcess from '../../../../store/item/useItemProcess';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { ItemGeoInfo, SystemIconDefine } from '../../../../entry';
import { useAtom } from 'jotai';
import { currentMapIconDefineAtom } from '../../../../store/icon';
import useDataSource from '../../../../store/datasource/useDataSource';
import { useItems } from '../../../../store/item/useItems';

type Props = {
    target: FeatureType[];

    /**
     * 編集対象としてFeatureType.STRUCTUREが指定され、
     * かつ、アイコンを指定可能なデータソースの場合、このfunctionが呼び出され、
     * 戻り値で返されたアイコンが描画に用いられる
     * @param icons 地図で使用可能なアイコン一覧
     * @returns 描画に用いるアイコン. 'cancel'の場合、後続処理中断。
     */
    iconFunction?: (icons: SystemIconDefine[]) => Promise<IconKey|'cancel'>;

    onCancel: () => void;

    /**
     * ユーザによる編集完了時に編集後のアイテム情報を返す
     * @param item 
     */
    onCommit: (id: DataId, item: ItemGeoInfo) => void;
}

enum Stage {
    SELECTING_FEATURE,  // 編集対象選択中

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
    const [ icons ] = useAtom(currentMapIconDefineAtom);
    const { isEnableIcon } = useDataSource();
    const { getItem } = useItems();

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

    const { confirm } = useConfirm();
    const onSelectFeature = useCallback(async(feature: Feature<Geometry>) => {
        selectedFeature.current = feature;

        const featureType = (feature.getProperties() as GeoProperties).featureType;

        if (featureType === FeatureType.STRUCTURE) {
            if (!props.iconFunction) {
                console.warn('iconFunction not defined');
                props.onCancel();
                return;
            }
            const id = selectedFeature.current.getId() as DataId;
            const item = getItem(id);
            if (!item) {
                console.warn('illegal item', id);
                return;
            }
            const enableIcon = isEnableIcon(item.datasourceId);
            if (!enableIcon) {
                confirm({
                    message: 'このピンのアイコンは編集できません',
                    btnPattern: ConfirmBtnPattern.OkOnly,
                })
                return;
            }
            const result = await props.iconFunction(icons);
            if (result === 'cancel') {
                props.onCancel();
                return;
            }

            const geoJson = createGeoJson(selectedFeature.current);

            props.onCommit(id, {
                geometry: geoJson.geometry,
                geoProperties: {
                    featureType: FeatureType.STRUCTURE,
                    icon: result,
                },
            })

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

    }, [map, icons, props, getItem, isEnableIcon, confirm]);

    const onCancel = useCallback(() => {
        props.onCancel();
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
            onCancel();
        }

        // 更新
        const currentPropeties = feature.getProperties() as GeoPropertiesForCore;
        const geoJson = currentPropeties.featureType === FeatureType.ROAD ? currentPropeties.lineJson : createGeoJson(feature);
        const geoProperties = extractGeoProperty(feature.getProperties());
        const id = selectedFeature.current?.getId() as DataId;
        updateItems([
            {
                id,
                geometry: geoJson.geometry,
                geoProperties,
            }
        ])

        onCancel();

    }, [onCancel, confirmHook, updateItems]);
    
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
                onOk={onSelectFeature} onCancel={onCancel} />
            )

        case Stage.EDITING:
            return (
                <PromptMessageBox 
                    message={'編集完了したら、完了ボタンを押下してください。\n※ポイント削除したい場合→>Altボタンを押しながらクリック'} 
                    ok={onEditOkClicked} 
                    cancel={onCancel} 
                    okname="完了" />
            );

        case Stage.SELECT_ROAD_WIDTH:
            const target = modifySource.current?.getFeatures()[0] as Feature;
            return (
                <RoadWidthSelecter targetRoad={target} onOk={onWidthSelected} onCancel={onCancel} />
            );

    }
}