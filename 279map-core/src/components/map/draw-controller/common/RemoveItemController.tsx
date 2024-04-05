import React, { useCallback } from 'react';
import { FeatureLike } from 'ol/Feature';
import useConfirm from '../../../common/confirm/useConfirm';
import SelectFeature from '../SelectFeature';
import { convertDataIdFromFeatureId } from '../../../../util/dataUtility';
import { ConfirmResult } from '../../../common/confirm/types';
import useItemProcess from '../../../../store/item/useItemProcess';
import { FeatureType } from '../../../../types-common/common-types';

type Props = {
    target: FeatureType[];
    close: () => void;  // 作図完了時のコールバック
}

/**
 * アイテム削除用コントローラ
 * @param props 
 * @returns 
 */
export default function RemoveItemController(props: Props) {
    const confirmHook = useConfirm();
    const { removeItem } = useItemProcess();

    const onRemoveOkClicked = useCallback(async(feature: FeatureLike) => {
        // 確認メッセージ
        const result = await confirmHook.confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }

        const dataId = convertDataIdFromFeatureId(feature.getId() as string);
        // DB更新
        removeItem(dataId);

        props.close();
    }, [props, confirmHook, removeItem]);

    const onCancel = useCallback(() => {
        props.close();
    }, [props]);

    return (
        <SelectFeature
            featureType={props.target}
            onOk={onRemoveOkClicked} onCancel={onCancel} />
    );
}