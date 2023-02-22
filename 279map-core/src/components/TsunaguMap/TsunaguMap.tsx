import { CategoryDefine, EventDefine, MapDefine, MapKind } from '279map-common';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { CommandHookType } from '../../api/useCommand';
import { store } from '../../store/configureStore';
import { DefaultIconDefine, EditContentInfoWithAttrParam, MapMode, NewContentInfoParam, ServerInfo } from '../../types/types';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { FilterDefine } from '../../store/operation/operationSlice';
import { callApi } from '../../api/api';
import { ConfigAPI } from "tsunagumap-api";
import OverlaySpinner from '../common/spinner/OverlaySpinner';

export type OnInitializeParam = {
    auth0: {
        domain: string;
        clientId: string;
        audience: string;
    }
}
export type OnConnectParam = {
    result: 'success',
    mapDefine: MapDefine,
    commandHook: CommandHookType,
} | {
    result: 'Unauthorized',
} | {
    result: 'Forbidden',
}
export type TsunaguMapProps = {
    mapId: string;
    mapServerHost: string;
    token?: string;
    iconDefine?: (DefaultIconDefine | {
        // デフォルトアイコンを指定する場合に使用
        id: 'default';
        useMaps: MapKind[];
    })[];
    disabledPopup?: boolean; // when true, the map don't show popup.
    disabledLabel?: boolean; // when true, the item's label hidden.
    disabledContentDialog?: boolean;    // when true, the content dialog didn't show even if you click a item.

    filter?: FilterDefine[];

    onInitialize?: (param: OnInitializeParam) => void;
    onConnect?: (param: OnConnectParam) => void;
    onMapKindChanged?: (mapKind: MapKind) => void;
    onSelect?: (targets: string[]) => void; // callback when items are selected
    onUnselect?: () => void;    // callback when items are unselected.
    onModeChanged?: (mode: MapMode) => void;    // callback when map mode has changed.
    onCategoriesLoaded?: (categories: CategoryDefine[]) => void;    // calback when categories has loaded or has changed.
    onEventsLoaded?: (events: EventDefine[]) => void;   // callback when events has loaded or has changed.

    onNewContentInfo?: (param: NewContentInfoParam) => void;    // callback when new content info kicked
    onEditContentInfo?: (param: EditContentInfoWithAttrParam) => void;  // callback when content edit kicked
}

export const OwnerContext = React.createContext<TsunaguMapProps>({
    mapId: '',
    mapServerHost: '',
    iconDefine: [],
    // mapKind: MapKind.Real,
});

enum Stage {
    Loading,
    Loaded,
    Failed,
}
export default function TsunaguMap(props: TsunaguMapProps) {
    const [ showTooltipId, setShowTooltipId ] = useState<{[name: string]: string}>({});
    const tooltipContextValue = {
        showIdMap: showTooltipId,
        setShowIdMap: setShowTooltipId,
    } as TooltipContextValue;
    const [ stage, setStage ] = useState(Stage.Loading);

    useEffect(() => {
        const mapServer = {
            domain: props.mapServerHost,
            ssl: true,
        } as ServerInfo;
        callApi(mapServer, ConfigAPI, undefined)
        .then((result) => {
            if (props.onInitialize) {
                props.onInitialize({
                    auth0: {
                        domain: result.auth0.domain,
                        clientId: result.auth0.clientId,
                        audience: result.auth0.audience,
                    }
                });
            }
            setStage(Stage.Loaded);
        })
        .catch((e) => {
            setStage(Stage.Failed);
        })
    }, [props.mapServerHost]);

    if (stage === Stage.Loading) {
        return (
            <OverlaySpinner message='初期化中...' />
        )
    } else if (stage === Stage.Failed) {
        return (
            <div className={styles.FailedMessageArea}>
                サーバアクセスに失敗しました。<br/>
                しばらくしても、このエラーが続く場合は、管理者へ連絡してください。
            </div>
        )
    }
    return (
        <>
            <OwnerContext.Provider value={props}>
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
        </>
    );
}