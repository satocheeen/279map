import React, { useCallback } from 'react';
import { FeatureLike } from 'ol/Feature';
import useConfirm from '../../../common/confirm/useConfirm';
import SelectFeature from '../SelectFeature';
import { useProcessMessage } from '../../../common/spinner/useProcessMessage';
import { LayerType } from '../../../TsunaguMap/VectorLayerMap';
import { convertDataIdFromFeatureId } from '../../../../util/dataUtility';
import { ConfirmResult } from '../../../common/confirm/types';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';
import { RemoveItemDocument } from '../../../../graphql/generated/graphql';
import useItemProcess from '../../../../store/item/useItemProcess';

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
            targetType={props.target}
            onOk={onRemoveOkClicked} onCancel={onCancel} />
    );
}