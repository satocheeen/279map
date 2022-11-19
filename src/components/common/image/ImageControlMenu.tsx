import React, { useCallback, useState } from 'react';
import { Button } from 'react-bootstrap';

export type ImageControlOperation = 'url' | 'file' | 'delete';
type Props = {
    mode: 'new' | 'update',
    onSelect?: (operation: ImageControlOperation) => void;
    hideLocalImageMenu?: boolean;    // trueを指定した場合、端末画像メニュー非表示
}

enum Stage {
    VIEW,            // [登録]or[更新+削除]ボタン表示。
    SELECT_METHOD,  // 画像登録方法選択状態
}

/**
 * 画像に対する操作メニュー
 * @param props 
 * @returns 
 */
export default function ImageControlMenu(props: Props) {
    const [ stage, setStage ] = useState(Stage.VIEW);

    const onDelete = useCallback(() => {
        if (props.onSelect) {
            props.onSelect('delete');
        }
    }, [props]);

    const onUrl = useCallback(() => {
        if (props.onSelect) {
            props.onSelect('url');
        }
    }, [props]);

    const onFile = useCallback(() => {
        if (props.onSelect) {
            props.onSelect('file');
        }
    }, [props]);

    const onUploadBtnClicked = useCallback(() => {
        if (props.hideLocalImageMenu) {
            // 端末画像メニュー非表示の場合は、「Web画像」選択と認識
            onUrl();
        } else {
            setStage(Stage.SELECT_METHOD);
        }
    }, [props.hideLocalImageMenu, onUrl]);

    switch(stage) {
        case Stage.VIEW:
            return (
                <div>
                    {props.mode === 'update' ?
                        <>
                            <Button variant="secondary" onClick={onUploadBtnClicked}>更新</Button>
                            <Button variant="secondary" onClick={onDelete}>削除</Button>
                        </>
                        :
                        <Button variant="secondary" onClick={onUploadBtnClicked}>登録</Button>
                    }
                </div>
            )
        case Stage.SELECT_METHOD:
            return (
                <>
                    <div>
                        <Button variant="outline-secondary" onClick={onUrl}>
                            <i className="icon-sphere"></i>
                            Web画像
                        </Button>
                        <Button variant="outline-secondary" onClick={onFile}>
                            <i className="icon-display"></i>
                            端末画像
                        </Button>
                    </div>
                    <div>
                        <Button variant="secondary" onClick={()=>setStage(Stage.VIEW)}>Cancel</Button>
                    </div>
                </>

            )
}
}