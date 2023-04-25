import React, { useContext, useEffect, useRef, useMemo } from 'react';
import { useAPI } from '../../../api/useAPI';
import { OwnerContext } from '../../TsunaguMap/TsunaguMap';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';
import { DataId } from '../../../279map-common';

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
    const { apiUrl } = useAPI();
    const { token } = useContext(OwnerContext);
    const sid = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return undefined;
        }
        return state.session.connectStatus.sid;
    });

    const url = useMemo(() => {
        return `${apiUrl}getthumb?id=${props.id.id}`;
    }, [props.id]);

    /**
     * 画像取得
     */
    useEffect(() => {
        if (!sid) return;
        fetch(url, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                Authorization:  token ? `Bearer ${token}` : '',
                sessionid: sid,
            },
        }).then((res) => {
            if (!res.ok) {
                throw new Error('get thumbnail failed.');
            }
            return res.blob();
        })
        .then((imgData) => {
            if (myRef.current) {
                myRef.current.src = URL.createObjectURL(imgData);            
            }
        })

    }, [url, apiUrl, sid, token]);

    return (
        <img ref={myRef} className={props.className} onClick={props.onClick} alt={props.alt} />
    );
}