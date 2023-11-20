import React, { Suspense, useImperativeHandle, useState, useMemo, useRef, useEffect, lazy } from 'react';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { AddNewContentParam, EditContentParam, LinkUnpointContentParam, TsunaguMapHandler, TsunaguMapProps } from '../../types/types';
import EventConnectorWithOwner, { EventControllerHandler } from './EventConnectorWithOwner';
import MapConnector from './MapConnector';
import ProcessOverlay from './ProcessOverlay';
import { Provider, createStore } from 'jotai';
import MapController from './MapController';
import MapChart from './MapChart';
import PopupContainer from '../popup/PopupContainer';
import LandNameOverlay from '../map/LandNameOverlay';
import DrawController, { DrawControllerHandler } from '../map/DrawController';
import ClusterMenuContainer from '../cluster-menu/ClusterMenuContainer';
import { instanceIdAtom, mapIdAtom, serverInfoAtom } from '../../store/session';
import ContentsSettingController from '../admin/contents-setting/ContentsSettingController';
import UserListController from '../admin/user-list/UserListController';
import { defaultIconDefineAtom } from '../../store/icon';
import MyGraphQLProvider from './MyGraphQLProvider';

const DefaultComponents = lazy(() => import('../default/DefaultComponents'));

type SomeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type OwnerContextType = Omit<SomeRequired<TsunaguMapProps, 'onAddNewContent'|'onEditContent'|'onLinkUnpointedContent'>, 'mapServer' | 'mapId'>;

export const OwnerContext = React.createContext<OwnerContextType>({
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

    const initializeFlagRef = useRef(false);
    const myStoreRef = useRef(createStore());

    useEffect(() => {
        const myStore = myStoreRef.current;
        const id = myStore.get(instanceIdAtom);
        console.log('TsunaguMap mounted', id);

        initializeFlagRef.current = true;
        return () => {
            // 再レンダリングされたらIDカウントアップ
            myStore.set(instanceIdAtom);
            console.log('TsunaguMap unmounted', id);
        }
    }, []);

    // レンダリング前に初期値設定する
    if (!initializeFlagRef.current) {
        myStoreRef.current.set(instanceIdAtom);
        myStoreRef.current.set(mapIdAtom, props.mapId);
        myStoreRef.current.set(serverInfoAtom, props.mapServer);
        if (props.iconDefine) {
            myStoreRef.current.set(defaultIconDefineAtom, props.iconDefine);
        }
    }

    useEffect(() => {
        if (myStoreRef.current.get(mapIdAtom) !== props.mapId) {
            myStoreRef.current.set(mapIdAtom, props.mapId);
        }    
    }, [props.mapId])

    useEffect(() => {
        if (myStoreRef.current.get(serverInfoAtom) !== props.mapServer) {
            myStoreRef.current.set(serverInfoAtom, props.mapServer);
        }    
    }, [props.mapServer])

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

    const eventControlerRef = useRef<EventControllerHandler>(null);
    const drawControllerRef = useRef<DrawControllerHandler>(null);
    const contentsSettingControlerRef = useRef<Pick<TsunaguMapHandler, 'showContentsSetting'>>(null);
    const userListControlerRef = useRef<Pick<TsunaguMapHandler, 'showUserList'>>(null);
    useImperativeHandle(ref, () => {
        return Object.assign({}, 
            drawControllerRef.current,
            eventControlerRef.current,
            contentsSettingControlerRef.current,
            userListControlerRef.current);
    })

    return (
        <div className={styles.TsunaguMap}>
            <OwnerContext.Provider value={ownerContextValue}>
                <Provider store={myStoreRef.current}>
                    <MapConnector server={props.mapServer}>
                        <MyGraphQLProvider>
                            <EventConnectorWithOwner ref={eventControlerRef} />
                            <TooltipContext.Provider value={tooltipContextValue}>
                                <MapController />
                                <MapChart />
                                <PopupContainer />
                                <LandNameOverlay />
                                <ClusterMenuContainer />

                                {/* 外部からの操作指示を受けて特定の動作をするコントローラー群 */}
                                <DrawController ref={drawControllerRef} />
                                <ContentsSettingController ref={contentsSettingControlerRef} />
                                <UserListController ref={userListControlerRef} />

                                <ConfirmDialog />

                                <Suspense>
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
                        </MyGraphQLProvider>
                    </MapConnector>
                    <ProcessOverlay />
                </Provider>
            </OwnerContext.Provider>
        </div>
    );
}
export default React.forwardRef(TsunaguMap);
