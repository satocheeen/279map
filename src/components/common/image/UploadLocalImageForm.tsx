import React, { useCallback, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { ImageInfo } from './types';
import * as imageUtility from './imageUtility';

type Props = {
    onLoad?: (image: ImageInfo) => void;
    onCancel?: () => void;
}

/**
 * 端末から画像をアップロードする方式
 * @param props 
 * @returns 
 */
export default function UploadLocalImageForm(props: Props) {
    const [errMsg, setErrMsg] = useState('');

    const onCancel = useCallback(() => {
        if (props.onCancel) {
            props.onCancel();
        }
    }, [props]);

    const onFileSelected = useCallback((event: React.FormEvent) => {
        setErrMsg('');
        const files = (event.target as any).files as FileList;
        if (files.length === 0) {
            return;
        }
        const file = files[0];

        const img = imageUtility.createImageForLoad({
            callback: (image: ImageInfo) => {
                if (props.onLoad) {
                    props.onLoad(image);
                }
            },
            errorCallback: () => {
                setErrMsg('この画像は取得できません.');
            }
        });
       const reader = new FileReader();
        reader.onload = (evt) => {
            img.src = evt.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, [props]);


    return (
        <>
            <div>
                <Form.Control type="file" data-browse="選択" accept="image" onChange={(e: React.FormEvent) => onFileSelected(e)} />
                <p className="text-danger">{errMsg}</p>
            </div>
            <div>
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
        </>
    );
}