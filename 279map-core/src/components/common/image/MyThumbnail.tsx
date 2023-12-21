import React, { useState, useRef, useEffect } from 'react';
import { DataId } from '279map-common';
import Spinner from '../spinner/Spinner';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';
import { GetThumbDocument, ThumbSize } from '../../../graphql/generated/graphql';

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
    
    const [ gqlClient ] = useAtom(clientAtom);
    const [ loaded, setLoaded ] = useState(false);

    /**
     * 画像取得
     */
    useEffect(() => {
        gqlClient.query(GetThumbDocument, {
            contentId: props.id,
            size: props.mode === 'thumb' ? ThumbSize.Thumbnail : ThumbSize.Medium,
        }).then((result) => {
            const base64 = result.data?.getThumb;
            if (myRef.current && base64) {
                myRef.current.src = 'data:image/' + base64;
            }
            setLoaded(true);
        });

    }, [props.id, props.mode, gqlClient]);

    return (
        <>
            <img ref={myRef} style={{visibility: loaded ? 'visible' : 'hidden'}} className={props.className} onClick={props.onClick} alt={props.alt} />
            {!loaded && <Spinner/> }
        </>
    );
}