import React, { useCallback, useContext, useRef, useState } from 'react';
import SelectStructureDialog from './SelectStructureDialog';
import { useOverlay } from '../../../common/spinner/useOverlay';
import SelectFeature from '../SelectFeature';
import { useAppDispatch } from '../../../../store/configureStore';
import { updateFeature } from '../../../../store/data/dataThunk';
import { FeatureType } from '../../../../279map-common';
import { SystemIconDefine } from '../../../../types/types';
import { FeatureLike } from 'ol/Feature';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { convertDataIdFromFeatureId } from '../../../../store/data/dataUtility';

type Props = {
    close: () => void;  // 編集完了時のコールバック
}

enum Stage {
    SELECTING_TARGET,   // 改築対象選択中
    SELECTING_STRUCTURE,    // 改築後の建物選択中
}

export default function ChangeStructureIconController(props: Props) {
    const selectedFeature = useRef<FeatureLike>();
    const spinnerHook = useOverlay();
    const dispatch = useAppDispatch();
    const [stage, setStage] = useState(Stage.SELECTING_TARGET);

    const onCancel = useCallback(() => {
        props.close();
    }, [props]);

    const onSelectFeature = useCallback((feature: FeatureLike) => {
        selectedFeature.current = feature;
        setStage(Stage.SELECTING_STRUCTURE);
    }, []);

    const onSelectedStructure = useCallback(async(iconDefine: SystemIconDefine) => {
        if (!selectedFeature.current) {
            console.warn('選択アイテムなし');
            return;
        }
        spinnerHook.showSpinner('更新中...');

        // update DB
        const id = convertDataIdFromFeatureId(selectedFeature.current.getId() as string);
        await dispatch(updateFeature({
            id,
            geoProperties: {
                featureType: FeatureType.STRUCTURE,
                icon: {
                    type: iconDefine.type,
                    id: iconDefine.id,
                },
            },
        }));

        spinnerHook.hideSpinner();
        props.close();
    }, [selectedFeature, dispatch, spinnerHook, props]);

    if (stage === Stage.SELECTING_TARGET) {
        return (
            <SelectFeature
                message='改築する建物を選択して、OKボタンを押下してください。'
                targetType={LayerType.Point}
                onOk={onSelectFeature} onCancel={onCancel} />
        //    <PromptMessageBox
        //         message='改築する建物を選択して、OKボタンを押下してください。'
        //         ok={onSelectFeature} cancel={onCancel}
        //         okdisabled={selectedFeature === undefined} />
        );
    } else {
        return (
            <SelectStructureDialog ok={onSelectedStructure} cancel={onCancel} />
        );
    }
}