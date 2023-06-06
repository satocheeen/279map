import React, { useImperativeHandle, useState, useMemo, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { AddNewContentParam, EditContentParam, LinkUnpointContentParam, TsunaguMapHandler, TsunaguMapProps } from '../../types/types';
import DefaultComponents from '../default/DefaultComponents';

type SomeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type OwnerContextType = SomeRequired<TsunaguMapProps, 'onAddNewContent'|'onEditContent'|'onLinkUnpointedContent'> & {
    mapInstanceId: string;
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
});

let componentCnt = 0;
function TsunaguMap(props: TsunaguMapProps, ref: React.ForwardedRef<TsunaguMapHandler>) {
    const mapInstanceId = useRef('map-' + (++componentCnt));
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
            mapInstanceId: mapInstanceId.current,
            onAddNewContent: props.onAddNewContent ?? function(param: AddNewContentParam){setDefaultNewContentParam(param)},
            onEditContent: props.onEditContent ?? function(param: EditContentParam){setDefaultEditContentParam(param)},
            onLinkUnpointedContent: props.onLinkUnpointedContent ?? function(param: LinkUnpointContentParam){setDefaultLinkUnpointedContentParam(param)},
        })
    }, [props, mapInstanceId]);

    const mapRef = useRef<TsunaguMapHandler>(null);
    useImperativeHandle(ref, () => mapRef.current ?? {
        switchMapKind() {},
        focusItem() {},
        drawStructure() {},
        moveStructure() {},
        changeStructure() {},
        removeStructure() {},
        drawTopography() {},
        drawRoad() {},
        editTopography() {},
        removeTopography() {},
        editTopographyInfo() {},
        loadContentsAPI() { throw ''},
        showDetailDialog() {},
        registContentAPI() { throw ''},
        updateContentAPI() { throw ''},
        linkContentToItemAPI() { throw ''},
        getSnsPreviewAPI() { throw '' },
        getUnpointDataAPI() { throw ''},
        getThumbnail() { throw ''},
        changeVisibleLayer() {},
    })

    return (
        <>
            <OwnerContext.Provider value={ownerContextValue}>
                <TooltipContext.Provider value={tooltipContextValue}>
                    <Provider store={store}>
                        <div className={styles.TsunaguMap}>
                            <MapWrapper ref={mapRef} />
                        </div>
                        <ConfirmDialog />
                        <ContentsModal />

                        {defaultLinkUnpointedContentParam &&
                            <DefaultComponents linkUnpointedContentParam={defaultLinkUnpointedContentParam} onClose={()=>{setDefaultLinkUnpointedContentParam(undefined)}} />
                        }
                        {defaultNewContentParam &&
                            <DefaultComponents newContentParam={defaultNewContentParam} onClose={()=>{setDefaultNewContentParam(undefined)}} />
                        }
                        {defaultEditContentParam &&
                            <DefaultComponents editContentParam={defaultEditContentParam} onClose={()=>{setDefaultEditContentParam(undefined)}} />
                        }
                    </Provider>
                </TooltipContext.Provider>
            </OwnerContext.Provider>
       </>
    );
}
export default React.forwardRef(TsunaguMap);
