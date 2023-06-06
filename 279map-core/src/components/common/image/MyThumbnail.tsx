import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { DataId } from '279map-common';
import { GetThumbAPI } from 'tsunagumap-api';
import { useMap } from '../../map/useMap';

type Props = {
    id: DataId; // サムネイル画像id（コンテンツID）
    className?: string;
    onClick?: () => void;
    alt: string;
}

/**
 * ヘッダー情報にセッションidを付与して画像を取得して、
 * サムネイル表示するコンポーネント
 * @param props 
 * @returns 
 */
export default function MyThumbnail(props: Props) {
    const myRef = useRef<HTMLImageElement>(null);
    const sid = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return undefined;
        }
        return state.session.connectStatus.sid;
    });
    const { getApi } = useMap();

    /**
     * 画像取得
     */
    useEffect(() => {
        if (!sid) return;
        getApi().callApi(GetThumbAPI, {
            id: props.id.id,
        }).then((imgData) => {
            if (myRef.current) {
                myRef.current.src = URL.createObjectURL(imgData);            
            }
        }).catch(e => {
            console.warn('get thumbnail failed.', e);
        });

    }, [getApi, sid, props.id.id]);

    return (
        <img ref={myRef} className={props.className} onClick={props.onClick} alt={props.alt} />
    );
}