import React, { useMemo, useState, useRef } from 'react';
import { DataId } from '279map-common';
import { GetImageUrlAPI, GetThumbAPI } from 'tsunagumap-api';
import { useWatch } from '../../../util/useWatch';
import Spinner from '../spinner/Spinner';
import { connectStatusAtom } from '../../../store/session';
import { useAtom } from 'jotai';
import { useApi } from '../../../api/useApi';

type Props = {
    id: DataId; // サムネイル画像id（コンテンツID）
    className?: string;
    onClick?: () => void;
    alt: string;
    mode: 'thumb' | 'original'; // thumb->サムネイル画像を表示、original->オリジナル画像を表示
}

/**
 * ヘッダー情報にセッションidを付与して画像を取得して、
 * サムネイル表示するコンポーネント
 * @param props 
 * @returns 
 */
export default function MyThumbnail(props: Props) {
    const myRef = useRef<HTMLImageElement>(null);
    const [connectStatus] = useAtom(connectStatusAtom);
    const sid = useMemo(() => {
        return connectStatus.sid;
    }, [connectStatus]);
    
    const { callApi } = useApi();
    const [ loaded, setLoaded ] = useState(false);

    /**
     * 画像取得
     */
    useWatch(() => {
        if (!sid) return;

        if (props.mode === 'thumb') {
            callApi(GetThumbAPI, {
                id: props.id.id,
            }).then((imgData) => {
                if (myRef.current) {
                    myRef.current.src = URL.createObjectURL(imgData);            
                }
            }).catch(e => {
                console.warn('get thumbnail failed.', e);
            }).finally(() => {
                setLoaded(true);
            });
    
        } else {
            callApi(GetImageUrlAPI, {
                id: props.id,
            }).then((imageUrl) => {
                if (myRef.current && imageUrl) {
                    myRef.current.src = imageUrl;
                }
            }).catch(e => {
                console.warn('get thumbnail failed.', e);
            }).finally(() => {
                setLoaded(true);
            });

        }

    }, [sid, props.id.id]);

    return (
        <>
            <img ref={myRef} style={{visibility: loaded ? 'visible' : 'hidden'}} className={props.className} onClick={props.onClick} alt={props.alt} />
            {!loaded && <Spinner/> }
        </>
    );
}