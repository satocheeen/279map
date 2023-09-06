import React, { Suspense, useImperativeHandle, useState, useMemo, useRef, useEffect, useId } from 'react';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { AddNewContentParam, EditContentParam, LinkUnpointContentParam, TsunaguMapHandler, TsunaguMapProps } from '../../types/types';
import DefaultComponents from '../default/DefaultComponents';
import UserListModal from '../admin/UserListModal';
import ValueConnectorWithOwner from './ValueConnectorWithOwner';
import MapConnector from './MapConnector';
import ProcessOverlay from './ProcessOverlay';
import { Provider, createStore } from 'jotai';
import EventFire from './EventFire';
import MapChart from './MapChart';
import PopupContainer from '../popup/PopupContainer';
import LandNameOverlay from '../map/LandNameOverlay';
import DrawController from '../map/DrawController';
import ClusterMenuContainer from '../cluster-menu/ClusterMenuContainer';
import { instanceIdAtom, mapIdAtom, serverInfoAtom } from '../../store/session';

type SomeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type OwnerContextType = Omit<SomeRequired<TsunaguMapProps, 'onAddNewContent'|'onEditContent'|'onLinkUnpointedContent'>, 'mapServer' | 'mapId'>;

export const OwnerContext = React.createContext<OwnerContextType>({
    iconDefine: [],
    onAddNewContent: () => {},
    onEditContent: () => {},
    onLinkUnpointedContent: () => {},
});

function TsunaguMap(props: TsunaguMapProps, ref: React.ForwardedRef<TsunaguMapHandler>) {
    // 必須パラメータチェック（呼び出し元がTypeScriptではなくJavaScriptだと漏れている可能性があるので）
    if (!props.mapId) {
        console.warn('mapId not found in TsunaguMap props', props);
        throw new Error('mapId not found in TsunaguMap props');
    }
    if (!props.mapServer) {
        console.warn('mapServer not found in TsunaguMap props', props);
        throw new Error('mapServer not found in TsunaguMap props');
    }

    const mapInstanceId = useId();
    const myStoreRef = useRef(createStore());

    useEffect(() => {
        console.log('TsunaguMap mounted', mapInstanceId);

        return () => {
            console.log('TsunaguMap unmounted', mapInstanceId);
        }
    }, [mapInstanceId]);

    if (myStoreRef.current.get(instanceIdAtom) !== mapInstanceId) {
        myStoreRef.current.set(instanceIdAtom, mapInstanceId);
    }

    if (myStoreRef.current.get(mapIdAtom) !== props.mapId) {
        myStoreRef.current.set(mapIdAtom, props.mapId);
    }

    if (myStoreRef.current.get(serverInfoAtom) !== props.mapServer) {
        myStoreRef.current.set(serverInfoAtom, props.mapServer);
    }

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
            onAddNewContent: props.onAddNewContent ?? function(param: AddNewContentParam){setDefaultNewContentParam(param)},
            onEditContent: props.onEditContent ?? function(param: EditContentParam){setDefaultEditContentParam(param)},
            onLinkUnpointedContent: props.onLinkUnpointedContent ?? function(param: LinkUnpointContentParam){setDefaultLinkUnpointedContentParam(param)},
        })
    }, [props]);

    const controlRef = useRef<TsunaguMapHandler>(null);
    useImperativeHandle(ref, () => {
        return controlRef.current ?? {
            switchMapKind() {throw 'default function'},
            focusItem() {throw 'default function'},
            drawStructure() {throw 'default function'},
            moveStructure() {throw 'default function'},
            changeStructure() {throw 'default function'},
            removeStructure() {throw 'default function'},
            drawTopography() {throw 'default function'},
            drawRoad() {throw 'default function'},
            editTopography() {throw 'default function'},
            removeTopography() {throw 'default function'},
            editTopographyInfo() {throw 'default function'},
            loadContentsAPI() { throw 'default function'},
            showDetailDialog() {throw 'default function'},
            registContentAPI() { throw 'default function'},
            updateContentAPI() { throw 'default function'},
            linkContentToItemAPI() { throw 'default function'},
            getSnsPreviewAPI() { throw 'default function' },
            getUnpointDataAPI() { throw 'default function'},
            getThumbnail() { throw 'default function'},
            changeVisibleLayer() { throw 'default function' },
            showUserList() { throw 'default function' },
        }
    })

    return (
        <div className={styles.TsunaguMap}>
            <OwnerContext.Provider value={ownerContextValue}>
                <Provider store={myStoreRef.current}>
                    <MapConnector server={props.mapServer}>
                        <ValueConnectorWithOwner ref={controlRef} />
                        <TooltipContext.Provider value={tooltipContextValue}>
                            <EventFire />
                            <MapChart />
                            <PopupContainer />
                            <LandNameOverlay />
                            <DrawController />
                            <ClusterMenuContainer />
                            <Suspense>
                                <ConfirmDialog />
                                <UserListModal />

                                {defaultLinkUnpointedContentParam &&
                                    <DefaultComponents linkUnpointedContentParam={defaultLinkUnpointedContentParam} onClose={()=>{setDefaultLinkUnpointedContentParam(undefined)}} />
                                }
                                {defaultNewContentParam &&
                                    <DefaultComponents newContentParam={defaultNewContentParam} onClose={()=>{setDefaultNewContentParam(undefined)}} />
                                }
                                {defaultEditContentParam &&
                                    <DefaultComponents editContentParam={defaultEditContentParam} onClose={()=>{setDefaultEditContentParam(undefined)}} />
                                }
                            </Suspense>
                        </TooltipContext.Provider>
                    </MapConnector>
                    <ProcessOverlay />
                </Provider>
            </OwnerContext.Provider>
        </div>
    );
}
export default React.forwardRef(TsunaguMap);
