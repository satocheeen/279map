import { FeatureLike } from 'ol/Feature';
import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch } from '../../../../store/configureStore';
import { updateFeature } from '../../../../store/data/dataThunk';
import Input from '../../../common/form/Input';
import { useProcessMessage } from '../../../common/spinner/useProcessMessage';
import PromptMessageBox from '../PromptMessageBox';
import SelectFeature from '../SelectFeature';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { convertDataIdFromFeatureId } from '../../../../store/data/dataUtility';
import { itemMapState } from '../../../../store/data/itemAtom';
import { useRecoilValue } from 'recoil';

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
    const itemMap = useRecoilValue(itemMapState);
    const dispatch = useAppDispatch();
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

    const onSelectFeature = useCallback((feature: FeatureLike) => {
        const id = feature.getId() as string;
        selectedFeatureId.current = id;

        setName(itemMap[id].name);

        setStage(Stage.INPUT_NAME);
    }, [itemMap]);

    const onClose = useCallback(() => {
        props.close();
    }, [props]);

    const onInputOk = useCallback(async() => {
        const h = showProcessMessage({
            overlay: true,
            spinner: true,
            message: '更新中...'
        });

        const id = convertDataIdFromFeatureId(selectedFeatureId.current as string);
        // update DB
        await dispatch(updateFeature({
            id,
            name,
        }));

        hideProcessMessage(h);
        props.close();

    }, [dispatch, showProcessMessage, hideProcessMessage, name, props]);

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