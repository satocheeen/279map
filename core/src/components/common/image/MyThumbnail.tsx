import React, { useState, useRef, useEffect } from 'react';
import Spinner from '../spinner/Spinner';
import { useAtom } from 'jotai';
import { clientAtom } from 'jotai-urql';
import { GetThumbDocument } from '../../../graphql/generated/graphql';
import { DataId } from '../../../types-common/common-types';

type Props = {
    contentId: DataId;
    className?: string;
    onClick?: () => void;
    alt: string;
}

/**
 * 指定のヘッダー情報にセッションidを付与して画像を取得して、
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
            contentId: props.contentId,
        }).then((result) => {
            const base64 = result.data?.getThumb;
            if (myRef.current && base64) {
                myRef.current.src = 'data:image/' + base64;
            }
            setLoaded(true);
        });

    }, [props, gqlClient]);

    return (
        <>
            <img ref={myRef} style={{visibility: loaded ? 'visible' : 'hidden'}} className={props.className} onClick={props.onClick} alt={props.alt} />
            {!loaded && <Spinner/> }
        </>
    );
}