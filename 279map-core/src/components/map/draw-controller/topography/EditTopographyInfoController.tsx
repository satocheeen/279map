import { FeatureLike } from 'ol/Feature';
import React, { useCallback, useRef, useState } from 'react';
import Input from '../../../common/form/Input';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from '../SelectFeature';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { convertDataIdFromFeatureId } from '../../../../util/dataUtility';
import { useItems } from '../../../../store/item/useItems';
import useItemProcess from '../../../../store/item/useItemProcess';

type Props = {
    close: () => void;  // 作図完了時のコールバック
}
enum Stage {
    SELECTING_FEATURE,
    INPUT_NAME,
}
export default function EditTopographyInfoController(props: Props) {
    const [stage, setStage] = useState(Stage.SELECTING_FEATURE);
    const selectedFeatureId = useRef<string>();
    const [name, setName] = useState('');
    const { getItem } = useItems();

    const onSelectFeature = useCallback(async(feature: FeatureLike) => {
        const id = feature.getId() as string;
        selectedFeatureId.current = id;
        const itemId = convertDataIdFromFeatureId(id);

        const item = getItem(itemId);
        setName(item?.name ?? '');

        setStage(Stage.INPUT_NAME);
    }, [getItem]);

    const onClose = useCallback(() => {
        props.close();
    }, [props]);

    const { updateItems } = useItemProcess();

    const onInputOk = useCallback(async() => {
        const id = convertDataIdFromFeatureId(selectedFeatureId.current as string);
        // update DB
        updateItems([
            {
                id,
                name,
            }
        ])
        props.close();

    }, [updateItems, name, props]);

    switch(stage) {
        case Stage.SELECTING_FEATURE:
            return (
                <SelectFeature
                targetType={LayerType.Topography}
                onOk={onSelectFeature} onCancel={onClose} />
            );
        case Stage.INPUT_NAME:
            return (
                <PromptMessageBox 
                    message="地名を入力してください" 
                    ok={onInputOk} cancel={onClose}>
                        <Input size={40} value={name} onChange={(e) => setName(e.target.value)} />
                </PromptMessageBox>
            )
    }
}