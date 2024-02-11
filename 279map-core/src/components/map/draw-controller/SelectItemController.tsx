import React, { Suspense, useCallback, useImperativeHandle, useState } from 'react';
import { DataId, FeatureType, MapMode, TsunaguMapHandler } from '../../../entry';
import LoadingOverlay from '../../common/spinner/LoadingOverlay';
import SelectFeature from './SelectFeature';
import { Feature } from 'ol';
import { convertDataIdFromFeatureId } from '../../../util/dataUtility';
import { mapModeAtom } from '../../../store/operation';
import { useAtom } from 'jotai';

/**
 * 特定のアイテムを選択するコントローラー
 */
type Props = {
}

export type SelectItemControllerHandler = Pick<TsunaguMapHandler, 'selectItem'>;

let resolveCallback = null as null | ((value: DataId | undefined) => void);

function SelectItemController({}: Props, ref: React.ForwardedRef<SelectItemControllerHandler>) {
    const [ , setMapMode] = useAtom(mapModeAtom);
    const [ show, setShow ] = useState(false);
    const [ targets, setTargets ] = useState<FeatureType[] | undefined>();

    useImperativeHandle(ref, () => ({
        selectItem(targets) {
            setShow(true);
            setMapMode(MapMode.Drawing);
            setTargets(targets);
            return new Promise<DataId|undefined>((resolve) => {
                resolveCallback = resolve;
            })
        }
    }))

    const handleCancel = useCallback(() => {
        setShow(false);
        setMapMode(MapMode.Normal);
        if (resolveCallback) {
            resolveCallback(undefined);
        }
    }, [setMapMode]);

    const handleSelect = useCallback((feature: Feature) => {
        setShow(false);
        setMapMode(MapMode.Normal);
        const idStr = feature.getId() as string;
        const id = convertDataIdFromFeatureId(idStr);
        if (resolveCallback) {
            resolveCallback(id);
        }
    }, [setMapMode])

    if (!show) return null;
    return (
        <Suspense fallback={<LoadingOverlay />}>
            <SelectFeature
                featureType={targets}
                onOk={handleSelect} onCancel={handleCancel} />
        </Suspense>
    );
}
export default React.forwardRef(SelectItemController);
