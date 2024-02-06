import React, { useCallback, useState } from 'react';
import Button from '../../common/button/Button';
import Input from '../../common/form/Input';
import { ImageInfo } from './types';
import * as imageUtility from './imageUtility';

type Props = {
    onLoad?: (image: ImageInfo) => void;
    onCancel?: () => void;
}

/**
 * 画像URL入力する方式
 * @param props 
 * @returns 
 */
export default function InputImageUrlForm(props: Props) {
    const [url, setUrl] = useState('');
    const [errMsg, setErrMsg] = useState('');

    const handleChangeUrl = useCallback((event: any) => {
        const url = event.target.value;
        setUrl(url);
    }, []);

    const onLoad = useCallback((evt: React.MouseEvent) => {
        // なぜか、取込ボタンクリック後にルートパスへの遷移によるリロードが走ってしまうので、preventDefaultしてる
        evt.preventDefault();

        setErrMsg('');
        const img = imageUtility.createImageForLoad({
            callback: (image: ImageInfo) => {
                if (props.onLoad) {
                    props.onLoad(Object.assign({
                        imageUrl: url,
                    }, image));
                }
            },
            errorCallback: () => {
                setErrMsg('この画像は取得できません.');
            }
        });
        img.src = url;
    }, [props, url]);

    const onCancel = useCallback(() => {
        if (props.onCancel) {
            props.onCancel();
        }
    }, [props]);

    return (
        <>
            <div>
                <Input value={url} placeholder="画像URLを入力" onChange={(e) => handleChangeUrl(e)} />
                <p className="text-danger">{errMsg}</p>
            </div>
            <div>
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button variant="secondary" onClick={onLoad}>取込</Button>
            </div>
        </>
    );
}