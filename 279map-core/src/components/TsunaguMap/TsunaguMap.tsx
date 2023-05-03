import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { AddNewContentParam, LinkUnpointContentParam, TsunaguMapProps } from '../../types/types';
import Spinner from '../common/spinner/Spinner';
import ContentInfoEditDialog from '../default/edit-content/ContentInfoEditDialog';

const LinkUnpointContentModal = lazy(() => import('../default/link-unpoint-content/LinkUnpointContentModal'));

type OwnerContextType = TsunaguMapProps & {
    onAddNewContent: (param: AddNewContentParam) => void;
    onLinkUnpointedContent: (param: LinkUnpointContentParam) => void;
};

export const OwnerContext = React.createContext<OwnerContextType>({
    mapId: '',
    mapServer: {
        host: '',
        ssl: false,
    },
    iconDefine: [],
    onAddNewContent: () => {},
    onLinkUnpointedContent: () => {},
});

export default function TsunaguMap(props: TsunaguMapProps) {
    const [ showTooltipId, setShowTooltipId ] = useState<{[name: string]: string}>({});
    const tooltipContextValue = {
        showIdMap: showTooltipId,
        setShowIdMap: setShowTooltipId,
    } as TooltipContextValue;

    // コンテンツ登録ダイアログ表示時に値セット
    const [ newContentByManualParam, setNewContentByManualParam ] = useState<AddNewContentParam|undefined>();

    const defaultOnAddNewContent = useCallback((param: AddNewContentParam) => {
        console.log('debug1');
        setNewContentByManualParam(param);
    }, []);

    const onCloseNewContentModal = useCallback(() => {
        setNewContentByManualParam(undefined);
    }, []);

    // 未配置コンテンツ登録ダイアログ表示時に値セット
    const [ linkUnpointedContentParam, setLinkUnpointedContentParam ] = useState<LinkUnpointContentParam|undefined>();

    const defaultOnLinkUnpointedContent = useCallback((param: LinkUnpointContentParam) => {
        setLinkUnpointedContentParam(param);
    }, []);

    const onCloseLinkUnpointContentModal = useCallback(() => {
        setLinkUnpointedContentParam(undefined);
    }, []);

    const ownerContextValue = useMemo((): OwnerContextType => {
        return Object.assign({}, props, {
            onAddNewContent: props.onAddNewContent ?? defaultOnAddNewContent,
            onLinkUnpointedContent: props.onLinkUnpointedContent ?? defaultOnLinkUnpointedContent,
        })
    }, [props, defaultOnAddNewContent, defaultOnLinkUnpointedContent]);

    return (
        <>
            <OwnerContext.Provider value={ownerContextValue}>
                <TooltipContext.Provider value={tooltipContextValue}>
                    <Provider store={store}>
                        <div className={styles.TsunaguMap}>
                            <MapWrapper />
                        </div>
                        <ConfirmDialog />
                        <ContentsModal />

                        {linkUnpointedContentParam &&
                            <Suspense fallback={<Spinner />}>
                                <LinkUnpointContentModal param={linkUnpointedContentParam} close={onCloseLinkUnpointContentModal} />
                            </Suspense>
                        }

                        {newContentByManualParam &&
                            <Suspense fallback={<Spinner />}>
                                <ContentInfoEditDialog type='new' param={newContentByManualParam} onClose={onCloseNewContentModal} />
                            </Suspense>
                        }
                    </Provider>
                </TooltipContext.Provider>
            </OwnerContext.Provider>
       </>
    );
}