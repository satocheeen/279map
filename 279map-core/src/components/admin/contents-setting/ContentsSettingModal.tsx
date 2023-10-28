import React, { Suspense, lazy, useCallback } from 'react';
import LoadingOverlay from '../../common/spinner/LoadingOverlay';
import { useAtom } from 'jotai';
import { showModalAtom } from './atom';

const DefaultContentsSettingModal = lazy(() => import('./DefaultContentsSettingModal'));

type Props = {
}

export default function ContentsSettingModal(props: Props) {
    const [showModal, setShowModal] = useAtom(showModalAtom);

    const onClose = useCallback(() => {
        setShowModal(false);
    }, [setShowModal]);

    console.log('showModal', showModal);
    if (!showModal) {
        return null;
    }

    // TODO: 呼び出し元からのモーダル差し替え対応
    return (
        <Suspense fallback={<LoadingOverlay />}>
            <DefaultContentsSettingModal onClose={onClose} />
        </Suspense>
    );
}