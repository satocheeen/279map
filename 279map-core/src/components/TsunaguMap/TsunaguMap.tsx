import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { NewContentByManualParam, LinkUnpointContentParam, TsunaguMapProps } from '../../types/types';
import Spinner from '../common/spinner/Spinner';

const LinkUnpointContentModal = lazy(() => import('../default/link-unpoint-content/LinkUnpointContentModal'));

type OwnerContextType = TsunaguMapProps & {
    onNewContentByManual: (param: NewContentByManualParam) => void;
    onLinkUnpointedContent: (param: LinkUnpointContentParam) => void;
};

export const OwnerContext = React.createContext<OwnerContextType>({
    mapId: '',
    mapServer: {
        host: '',
        protocol: 'http',
    },
    iconDefine: [],
    onNewContentByManual: () => {},
    onLinkUnpointedContent: () => {},
});

export default function TsunaguMap(props: TsunaguMapProps) {
    const [ showTooltipId, setShowTooltipId ] = useState<{[name: string]: string}>({});
    const tooltipContextValue = {
        showIdMap: showTooltipId,
        setShowIdMap: setShowTooltipId,
    } as TooltipContextValue;

    const [ linkUnpointedContentParam, setLinkUnpointedContentParam ] = useState<LinkUnpointContentParam|undefined>();

    const defaultOnNewContentByManual = useCallback(() => {

    }, []);

    const defaultOnLinkUnpointedContent = useCallback((param: LinkUnpointContentParam) => {
        setLinkUnpointedContentParam(param);
    }, []);

    const onCloseLinkUnpointContentModal = useCallback(() => {
        setLinkUnpointedContentParam(undefined);
    }, []);

    const ownerContextValue = useMemo((): OwnerContextType => {
        return Object.assign({}, props, {
            onNewContentByManual: props.onNewContentByManual ?? defaultOnNewContentByManual,
            onLinkUnpointedContent: props.onLinkUnpointedContent ?? defaultOnLinkUnpointedContent,
        })
    }, [props, defaultOnNewContentByManual, defaultOnLinkUnpointedContent]);

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
                    </Provider>
                </TooltipContext.Provider>
            </OwnerContext.Provider>

            {linkUnpointedContentParam &&
                <Suspense fallback={<Spinner />}>
                    <LinkUnpointContentModal param={linkUnpointedContentParam} close={onCloseLinkUnpointContentModal} />
                </Suspense>
            }
        </>
    );
}