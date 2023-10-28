import React, { lazy, Suspense, useCallback, useImperativeHandle, useState } from 'react';
import { TsunaguMapHandler } from '../../../types/types';
import { useAtomCallback } from 'jotai/utils';
import { authLvAtom } from '../../../store/session';
import { Auth } from '279map-common';
import LoadingOverlay from '../../common/spinner/LoadingOverlay';
const DefaultUserListModal = lazy(() => import('./DefaultUserListModal'));

type Props = {
}

function UserListController(props: Props, ref: React.ForwardedRef<Pick<TsunaguMapHandler,'showUserList'>>) {
    const [showModal, setShowModal] = useState(false);

    const showUserList = useAtomCallback(
        useCallback((get) => {
            const authLv = get(authLvAtom);
            if (authLv !== Auth.Admin) {
                console.warn('no authorization', authLv);
                return;
            }
            setShowModal(true);
        }, [])
    )
    useImperativeHandle(ref, () => ({
        showUserList,
    }));

    if (!showModal) return null;

    return (
        <Suspense fallback={<LoadingOverlay />}>
            <DefaultUserListModal onClose={()=>setShowModal(false)} />
        </Suspense>
    );
}
export default React.forwardRef(UserListController);
