import React, { useCallback, useContext, useRef, useState } from 'react';
import myStyles from './SwitchMapKindDriver.module.scss';
import { DriverContext } from '../TestMap';
import { Auth, MapKind } from '../../entry';

type Props = {
    onMapShow: (mapId: string, mapKind?: MapKind) => void;
    onGetMetaInfo: (mapId: string) => void;
}

export default function SwitchMapKindDriver(props: Props) {
    const { getMap, mapKind, authLv } = useContext(DriverContext);
    const mapIdTextRef = useRef<HTMLInputElement>(null);
    const isSetDefaultMapKindCheckboxRef = useRef<HTMLInputElement>(null);
    const [ myMapKind, setMyMapKind ] = useState(MapKind.Real);

    const handleMapIdChanged = useCallback(() => {
        if (!mapIdTextRef.current || !isSetDefaultMapKindCheckboxRef.current) return;
        if (isSetDefaultMapKindCheckboxRef.current.checked) {
            props.onMapShow(mapIdTextRef.current.value, myMapKind);

        } else {
            props.onMapShow(mapIdTextRef.current.value);
        }
    }, [props, myMapKind])

    const changeMapKind = useCallback((mapKind: MapKind) => {
        setMyMapKind(mapKind)
        if (authLv !== Auth.None) {
            getMap()?.switchMapKind(mapKind);
        }
    }, [getMap, authLv])

    const handleGetMetaInfoClicked = useCallback(() => {
        const mapId = mapIdTextRef.current?.value ?? '';
        if (mapId.length === 0) return;
        props.onGetMetaInfo(mapId);
    }, [props])

    if (mapKind !== myMapKind && authLv !== Auth.None) {
        // 地図接続後に地図種別反映
        setMyMapKind(mapKind)
    }

    return (
        <div className={myStyles.Container}>
            <label>
                地図ID:
                <input type='text' ref={mapIdTextRef} />
            </label>
            <div className={myStyles.Row}>
                <button onClick={handleGetMetaInfoClicked}>メタ情報取得</button>
            </div>
            <div className={myStyles.Row}>
                <button onClick={handleMapIdChanged}>地図表示</button>
                <label>
                    <input type='checkbox' ref={isSetDefaultMapKindCheckboxRef} />
                    初期地図種別指定
                </label>
            </div>
            <div className={myStyles.Row}>
                <label>
                    <input type="radio" checked={myMapKind===MapKind.Real} onChange={() => changeMapKind(MapKind.Real)} />
                    日本地図
                </label>
                <label>
                    <input type="radio" checked={myMapKind===MapKind.Virtual} onChange={() => changeMapKind(MapKind.Virtual)} />
                    村マップ
                </label>
            </div>
        </div>
);
}