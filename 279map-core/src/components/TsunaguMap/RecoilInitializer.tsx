import React, { useContext } from 'react';
import { OwnerContext } from './TsunaguMap';
import { useWatch } from '../../util/useWatch';
import { useSetRecoilState } from 'recoil';
import { instanceIdState, mapIdState, mapServerState } from '../../store/map';
import { createAPICallerInstance } from '../../api/ApiCaller';

type Props = {
    children: React.ReactNode | React.ReactNode[];
}

/**
 * Recoilの初期化。
 * - OwnerContextで設定された値のうち、必要なものをRecoilに設定する。
 * - 地図サーバーとのセッション確立する
 * @param props 
 * @returns 
 */
export default function RecoilInitializer(props: Props) {
    const ownerContext = useContext(OwnerContext);
    const setInstanceId = useSetRecoilState(instanceIdState);
    const setMapId = useSetRecoilState(mapIdState);
    const setMapServer = useSetRecoilState(mapServerState);

    useWatch(() => {
        setInstanceId(ownerContext.mapInstanceId);
        console.log('setMapServer', ownerContext.mapInstanceId, ownerContext.mapServer);
        // API Accessor用意
        createAPICallerInstance(ownerContext.mapInstanceId, ownerContext.mapServer, (error) => {
            // コネクションエラー時(リロードが必要なエラー)
            console.warn('connection error', error);
        });

        setMapServer(ownerContext.mapServer);
    }, [ownerContext.mapServer]);

    useWatch(() => {
        setMapId(ownerContext.mapId);
    }, [ownerContext.mapId]);

    return (
        <>
            {props.children}
        </>
    );
}