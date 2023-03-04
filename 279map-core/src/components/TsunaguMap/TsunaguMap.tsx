import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/configureStore';
import MapWrapper from './MapWrapper';
import styles from './TsunaguMap.module.scss';
import './TsunaguMap.scss';
import ConfirmDialog from '../common/confirm/ConfirmDialog';
import ContentsModal from '../contents/ContentsModal';
import { TooltipContext, TooltipContextValue } from '../common/tooltip/Tooltip';
import { TsunaguMapProps } from '../../types/types';

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