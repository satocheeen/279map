import { Map } from 'ol';
import React, { useCallback } from 'react';
import { FeatureLike } from 'ol/Feature';
import useConfirm, { ConfirmResult } from '../../../common/confirm/useConfirm';
import SelectFeature from '../SelectFeature';
import { useSpinner } from '../../../common/spinner/useSpinner';
import { useAppDispatch } from '../../../../store/configureStore';
import { removeFeature } from '../../../../store/data/dataThunk';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';

type Props = {
    map: Map;   // コントロール対象の地図
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
    const spinnerHook = useSpinner();
    const dispatch = useAppDispatch();

    const onRemoveOkClicked = useCallback(async(feature: FeatureLike) => {
        // 確認メッセージ
        const result = await confirmHook.confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }

        spinnerHook.showSpinner('削除中...');

        // DB更新
        await dispatch(removeFeature({
            // TODO: data_source_id考慮
            id: {
                id: feature.getId() as string,
                dataSourceId: '',
            },
            onlyGeoInfo: false,
        }));

        spinnerHook.hideSpinner();

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