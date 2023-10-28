import { useAtomCallback } from 'jotai/utils';
import React, { lazy, Suspense, useCallback, useImperativeHandle, useState } from 'react';
import { authLvAtom } from '../../../store/session';
import { Auth } from '279map-common';
import LoadingOverlay from '../../common/spinner/LoadingOverlay';
import { TsunaguMapHandler } from '../../../types/types';
const DefaultContentsSettingModal = lazy(() => import('./DefaultContentsSettingModal'));

type Props = {
}

function ContentsSettingController(props: Props, ref: React.ForwardedRef<Pick<TsunaguMapHandler, 'showContentsSetting'>>) {
    const [isShowContentsSetting, setShowContentsSetting] = useState(false);
    const showContentsSetting = useAtomCallback(
        useCallback((get) => {
            const authLv = get(authLvAtom);
            if (authLv !== Auth.Admin) {
                console.warn('no authorization', authLv);
                return;
            }
            // Modalを表示
            setShowContentsSetting(true);
        }, [])
    );

    useImperativeHandle(ref, () => ({
        showContentsSetting,
    }));

    if (!isShowContentsSetting) return null;

    return (
        <Suspense fallback={<LoadingOverlay />}>
            <DefaultContentsSettingModal onClose={()=>setShowContentsSetting(false)} />
        </Suspense>
    );
}
export default React.forwardRef(ContentsSettingController);
