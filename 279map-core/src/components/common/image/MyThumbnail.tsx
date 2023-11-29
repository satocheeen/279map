import React, { useMemo, useState, useRef } from 'react';
import { DataId } from '279map-common';
import { GetImageUrlAPI } from 'tsunagumap-api';
import { useWatch } from '../../../util/useWatch';
import Spinner from '../spinner/Spinner';
import { connectStatusAtom } from '../../../store/session';
import { useAtom } from 'jotai';
import { useApi } from '../../../api/useApi';
import { clientAtom } from 'jotai-urql';
import { GetThumbDocument } from '../../../graphql/generated/graphql';

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
    const [ gqlClient ] = useAtom(clientAtom);
    const [ loaded, setLoaded ] = useState(false);

    /**
     * 画像取得
     */
    useWatch(() => {
        if (!sid) return;

        if (props.mode === 'thumb') {
            gqlClient.query(GetThumbDocument, {
                contentId: props.id,
            }).then((result) => {
                const base64 = result.data?.getThumb;
                if (myRef.current && base64) {
                    myRef.current.src = 'data:image/' + base64;
                }
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