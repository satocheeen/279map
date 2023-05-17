import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { AddNewContentParam, EditContentParam, LinkUnpointContentParam, TsunaguMapProps } from '../../types/types';
import Spinner from '../common/spinner/Spinner';
import LoadingOverlay from '../common/spinner/LoadingOverlay';

const LinkUnpointContentModal = lazy(() => import('../default/link-unpoint-content/LinkUnpointContentModal'));
const ContentInfoEditDialog = lazy(() => import('../default/edit-content/ContentInfoEditDialog'));

type SomeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type OwnerContextType = SomeRequired<TsunaguMapProps, 'onAddNewContent'|'onEditContent'|'onLinkUnpointedContent'> & {
    mapInstanceId: string;
    setMapInstanceId: (id: string) => void;
};

export const OwnerContext = React.createContext<OwnerContextType>({
    mapInstanceId: '',
    mapId: '',
    mapServer: {
        host: '',
        ssl: false,
    },
    iconDefine: [],
    onAddNewContent: () => {},
    onEditContent: () => {},
    onLinkUnpointedContent: () => {},
    setMapInstanceId: (id: string) => {},
});

export default function TsunaguMap(props: TsunaguMapProps) {
    const [mapInstanceId, setMapInstanceId ] = useState<string>('');
    const [ showTooltipId, setShowTooltipId ] = useState<{[name: string]: string}>({});
    const tooltipContextValue = {
        showIdMap: showTooltipId,
        setShowIdMap: setShowTooltipId,
    } as TooltipContextValue;

    // デフォルトコンテンツ登録ダイアログ表示時に値セット
    const [ defaultNewContentParam, setDefaultNewContentParam ] = useState<AddNewContentParam|undefined>();

    // デフォルトコンテンツ編集ダイアログ表示時に値セット
    const [ defaultEditContentParam, setDefaultEditContentParam ] = useState<EditContentParam|undefined>();

    // デフォルト未配置コンテンツ登録ダイアログ表示時に値セット
    const [ defaultLinkUnpointedContentParam, setDefaultLinkUnpointedContentParam ] = useState<LinkUnpointContentParam|undefined>();

    const ownerContextValue = useMemo((): OwnerContextType => {
        return Object.assign({}, props, {
            mapInstanceId,
            setMapInstanceId,
            onAddNewContent: props.onAddNewContent ?? function(param: AddNewContentParam){setDefaultNewContentParam(param)},
            onEditContent: props.onEditContent ?? function(param: EditContentParam){setDefaultEditContentParam(param)},
            onLinkUnpointedContent: props.onLinkUnpointedContent ?? function(param: LinkUnpointContentParam){setDefaultLinkUnpointedContentParam(param)},
        })
    }, [props, mapInstanceId]);

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

                        {defaultLinkUnpointedContentParam &&
                            <Suspense fallback={<LoadingOverlay />}>
                                <LinkUnpointContentModal param={defaultLinkUnpointedContentParam} close={()=>{setDefaultLinkUnpointedContentParam(undefined)}} />
                            </Suspense>
                        }
                        {defaultNewContentParam &&
                            <Suspense fallback={<LoadingOverlay />}>
                                <ContentInfoEditDialog type='new' param={defaultNewContentParam} onClose={()=>{setDefaultNewContentParam(undefined)}} />
                            </Suspense>
                        }
                        {defaultEditContentParam &&
                            <Suspense fallback={<LoadingOverlay />}>
                                <ContentInfoEditDialog type='edit' param={defaultEditContentParam} onClose={()=>{setDefaultEditContentParam(undefined)}} />
                            </Suspense>
                        }
                    </Provider>
                </TooltipContext.Provider>
            </OwnerContext.Provider>
       </>
    );
}