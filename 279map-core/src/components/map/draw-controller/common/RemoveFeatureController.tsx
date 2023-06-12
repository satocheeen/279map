import React, { useCallback } from 'react';
import { FeatureLike } from 'ol/Feature';
import useConfirm, { ConfirmResult } from '../../../common/confirm/useConfirm';
import SelectFeature from '../SelectFeature';
import { useProcessMessage } from '../../../common/spinner/useProcessMessage';
import { useAppDispatch } from '../../../../store/configureStore';
import { removeFeature } from '../../../../store/data/dataThunk';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { convertDataIdFromFeatureId } from '../../../../store/data/dataUtility';

type Props = {
    target: LayerType;
    close: () => void;  // 作図完了時のコールバック
}

/**
 * 地形削除用コントローラ
 * @param props 
 * @returns 
 */
export default function RemoveFeatureController(props: Props) {
    const confirmHook = useConfirm();
    const spinnerHook = useProcessMessage();
    const dispatch = useAppDispatch();

    const onRemoveOkClicked = useCallback(async(feature: FeatureLike) => {
        // 確認メッセージ
        const result = await confirmHook.confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }

        const h = spinnerHook.showProcessMessage({
            overlay: true,
            spinner: true,
            message: '削除中...'
        });

        const dataId = convertDataIdFromFeatureId(feature.getId() as string);
        // DB更新
        await dispatch(removeFeature({
            id: dataId,
            onlyGeoInfo: false,
        }));

        spinnerHook.hideProcessMessage(h);

        props.close();
    }, [props, confirmHook, dispatch, spinnerHook]);

    const onCancel = useCallback(() => {
        props.close();
    }, [props]);

    return (
        <SelectFeature
            targetType={props.target}
            onOk={onRemoveOkClicked} onCancel={onCancel} />
    );
}