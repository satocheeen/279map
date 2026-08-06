import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ImageRegister.module.scss';
import { ImageInfo } from './types';
import ImageControlMenu, { ImageControlOperation } from './ImageControlMenu';
import InputImageUrlForm from './InputImageUrlForm';
import UploadLocalImageForm from './UploadLocalImageForm';
import * as imageUtility from './imageUtility';

enum Stage {
    SELECT_METHOD,  // 画像登録方法選択状態
    INPUT_URL,      // URLでの画像登録中
    INPUT_FILE,     // 端末画像登録中
}

type Props = {
    imageUrl?: string;  // 指定されている場合、これを現在の画像として表示
    onSelect?: (image: ImageInfo) => void,  // 画像が選択された場合のコールバック
}

/**
 * 画像取得コンポーネント
 * Webまたは端末から画像を取得する。
 * @param props 
 * @returns 
 */
export default function ImageRegister(props: Props) {
    const [currentMode, setCurrentMode] = useState(Stage.SELECT_METHOD);
    const [image, setImage] = useState<ImageInfo>();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!props.imageUrl) {
            return;
        }
        const img = imageUtility.createImageForLoad({
            callback: (image: ImageInfo) => {
                setImage(image);
            },
            errorCallback: () => {
            }
        });
        img.src = props.imageUrl;

    }, [props.imageUrl]);

    useEffect(() => {
        if (!image) {
            return;
        }
        const img = new Image();
        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const canvas = canvasRef.current;
            if (canvas === null) {
                return;
            }
            canvas.setAttribute('width', width + '');
            canvas.setAttribute('height', height + '');
            const ctx = canvas.getContext('2d');
            if (ctx !== null) {
                ctx.drawImage(img, 0, 0, width, height);
            }
        };
        img.src = image.thumb;
    }, [image]);

    const onSelectOperation = useCallback((operation: ImageControlOperation) => {
        switch(operation) {
            case 'url':
                setCurrentMode(Stage.INPUT_URL);
                break;
            case 'file':
                setCurrentMode(Stage.INPUT_FILE);
                break;
            case 'delete':
                // TODO:
        }
    }, []);

    const onLoad = useCallback((image: ImageInfo) => {
        setImage(image);
        setCurrentMode(Stage.SELECT_METHOD);
        if (props.onSelect) {
            props.onSelect(image);
        }
    }, [props])

    const controller = useMemo(() => {
        switch(currentMode) {
            case Stage.SELECT_METHOD:
                return (
                    <ImageControlMenu mode={image ? 'update' : 'new'} hideLocalImageMenu={true} onSelect={onSelectOperation} />
                );
            case Stage.INPUT_URL:
                return (
                    <InputImageUrlForm onLoad={onLoad} onCancel={()=>setCurrentMode(Stage.SELECT_METHOD)} />
                );
    
            case Stage.INPUT_FILE:
                return (
                    <UploadLocalImageForm onLoad={onLoad} onCancel={()=>setCurrentMode(Stage.SELECT_METHOD)} />
                );
        }
    
    }, [currentMode, onLoad, onSelectOperation, image]);

    return (
        <div className={styles.Contents}>
            <div className={`${styles.ThumbArea} ${!image ? styles.NoImage : ''}`}>
                {!image &&
                    <p>なし</p>
                }
                <canvas ref={canvasRef} className="img-canvas" width="0" height="0" />
            </div>
            <div className={styles.ControlArea}>
                {controller}
            </div>
        </div>
    )
}

