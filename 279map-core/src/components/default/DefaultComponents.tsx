import React, { lazy, Suspense } from 'react';
import { AddNewContentParam, EditContentParam, LinkUnpointContentParam, TsunaguMapProps } from '../../types/types';
import LoadingOverlay from '../common/spinner/LoadingOverlay';

const LinkUnpointContentModal = lazy(() => import('../default/link-unpoint-content/LinkUnpointContentModal'));
const ContentInfoEditDialog = lazy(() => import('../default/edit-content/ContentInfoEditDialog'));

type Props = ({
    // デフォルトの既存コンテンツ設定コンポーネントを表示する場合に設定する
    linkUnpointedContentParam: LinkUnpointContentParam;
} | {
    // デフォルトのコンテンツ追加コンポーネントを表示する場合に設定する
    newContentParam: AddNewContentParam;
} | {
    // デフォルトのコンテンツ編集コンポーネントを表示する場合に設定する
    editContentParam: EditContentParam;
}) & {
    onClose: () => void;
};

export default function DefaultComponents(props: Props | undefined) {
    if (!props) return null;

    return (
        <>
            {'linkUnpointedContentParam' in props &&
                <Suspense fallback={<LoadingOverlay />}>
                    <LinkUnpointContentModal param={props.linkUnpointedContentParam} close={props.onClose} />
                </Suspense>
            }
            {'newContentParam' in props &&
                <Suspense fallback={<LoadingOverlay />}>
                    <ContentInfoEditDialog type='new' param={props.newContentParam} onClose={props.onClose} />
                </Suspense>
            }
            {'editContentParam' in props &&
                <Suspense fallback={<LoadingOverlay />}>
                    <ContentInfoEditDialog type='edit' param={props.editContentParam} onClose={props.onClose} />
                </Suspense>
            }
        </>
    );
}