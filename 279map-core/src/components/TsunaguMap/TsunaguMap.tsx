import { CategoryDefine, EventDefine, MapKind } from '279map-common';
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { CommandHookType } from '../../api/useCommand';
import { store } from '../../store/configureStore';
import { DefaultIconDefine, EditContentInfoWithAttrParam, MapMode, NewContentInfoParam } from '../../types/types';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { FilterDefine } from '../../store/operation/operationSlice';
import { ConnectedMap } from '../../store/session/sessionSlice';

export type OnConnectParam = {
    result: 'success',
    mapDefine: ConnectedMap,
    commandHook: CommandHookType,
} | {
    result: 'Unauthorized',
} | {
    result: 'Forbidden',
}
export type TsunaguMapProps = {
    mapId: string;
    mapServerHost: string;
    auth?: string;
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
export default function TsunaguMap(props: TsunaguMapProps) {
    const [ showTooltipId, setShowTooltipId ] = useState<{[name: string]: string}>({});
    const tooltipContextValue = {
        showIdMap: showTooltipId,
        setShowIdMap: setShowTooltipId,
    } as TooltipContextValue;

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