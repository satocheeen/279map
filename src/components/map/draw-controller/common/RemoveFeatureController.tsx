import { Map } from 'ol';
import React, { useCallback } from 'react';
import Feature from 'ol/Feature';
import useConfirm, { ConfirmBtnPattern, ConfirmResult } from '../../../common/confirm/useConfirm';
import SelectFeature from '../SelectFeature';
import { useSpinner } from '../../../common/spinner/useSpinner';
import { useAppDispatch } from '../../../../store/configureStore';
import { removeFeature } from '../../../../store/data/dataThunk';

type Props = {
    map: Map;   // コントロール対象の地図
    target: 'topography' | 'structure';
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

    const onRemoveOkClicked = useCallback(async(feature: Feature) => {
        // 確認メッセージ
        const result = await confirmHook.confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }

        const result2 = await confirmHook.confirm({
            message: 'Notionページも削除しますか。\nはい→Notionページも削除する\nいいえ→地図上からのみ削除する',
            btnPattern: ConfirmBtnPattern.YesNo,
        });
        const onlyGeoInfo = result2 === ConfirmResult.No;

        spinnerHook.showSpinner('削除中...');

        // DB更新
        await dispatch(removeFeature({
            id: feature.getId() as string,
            onlyGeoInfo,
        }));

        spinnerHook.hideSpinner();

        props.close();
    }, [props, confirmHook, dispatch, spinnerHook]);

    const onCancel = useCallback(() => {
        props.close();
    }, [props]);

    return (
        <SelectFeature
            map={props.map}
            target={props.target}
            onOk={onRemoveOkClicked} onCancel={onCancel} />
    );
}