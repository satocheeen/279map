import React, { useCallback, useContext, useRef, useState } from 'react';
import styles from '../TestMap.module.scss';
import { DriverContext } from '../TestMap';
import { ThumbSize } from '../../entry';
import myStyles from './LoadImageDriver.module.scss';

type Props = {
}

export default function LoadImageDriver(props: Props) {
    const { getMap } = useContext(DriverContext);
    const [imageIdText, setImageIdText] = useState('');
    const myRef = useRef<HTMLImageElement>(null);

    const loadImage = useCallback(async() => {
        const result = await getMap()?.loadImage({
            imageId: Number(imageIdText),
            size: ThumbSize.Medium,
        });
        if (myRef.current && result) {
            myRef.current.src = 'data:image/' + result;
        }
    }, [getMap, imageIdText]);

    return (
        <div className={myStyles.Container}>
            <div className={styles.PropName}>画像ロード</div>
            <label>
                imageId
                <input type='text' value={imageIdText} onChange={evt=>setImageIdText(evt.target.value)}/>
            </label>
            <button onClick={loadImage}>load Image</button>
            <img ref={myRef} />
        </div>
    );
}