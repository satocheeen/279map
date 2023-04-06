import React, { useContext, useEffect, useRef } from 'react';
import { useAPI } from '../../../api/useAPI';
import { OwnerContext } from '../../TsunaguMap/TsunaguMap';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/configureStore';

type Props = {
    id: string; // サムネイル画像id（コンテンツID）
    className?: string;
    onClick?: () => void;
    alt: string;
}

/**
 * ヘッダー情報にセッションidを付与して画像を取得して、
 * イメージ表示するコンポーネント
 * @param props 
 * @returns 
 */
export default function MyImage(props: Props) {
    const myRef = useRef<HTMLImageElement>(null);
    const { apiUrl } = useAPI();
    const { token } = useContext(OwnerContext);
    const sid = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return undefined;
        }
        return state.session.connectStatus.sid;
    });

    /**
     * 画像取得
     */
    useEffect(() => {
        if (!sid) return;
        const url = `${apiUrl}getthumb?id=${props.id}`;
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

    }, [props.id, apiUrl, sid, token]);

    return (
        <img ref={myRef} className={props.className} onClick={props.onClick} alt={props.alt} />
    );
}