import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ContentInfoForm from './ContentInfoForm';
import styles from './ContentInfoEditDialog.module.scss';
import { AddNewContentParam, EditContentParam } from '../../../types/types';
import { ContentAttr } from '../../../279map-common';
import { useCommand } from '../../../api/useCommand';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '../../common';

type Props = {
    onClose?: () => void;
} & (
    {
        type: 'new';
        param: AddNewContentParam;
    } | {
        type: 'edit';
        param: EditContentParam;
    }
)
export type AttrResult = ContentAttr;

/**
 * アイテム情報登録・編集コンポーネント
 */
export default function ContentInfoEditDialog(props: Props) {
    const [attrValue, setAttrValue] = useState<ContentAttr>({
        title: '',
        overview: '',
        type: 'normal',
        categories: [],
    });
    const itemMap = {};
    // イベントリスナーの中で使用するため、refに格納
    const itemMapRef = useRef<typeof itemMap>();
    itemMapRef.current = itemMap;
    const [ spinner, setSpinner ] = useState<false|string>(false);
    const commandHook = useCommand();

    useEffect(() => {
        if (props.type === 'edit') {
            setAttrValue(props.param.currentAttr);
        } else {
            // 値クリア
            setAttrValue({
                title: '',
                overview: '',
                type: 'normal',
                categories: [],
            });
        }
    }, [props]);

    const onOk = useCallback(async() => {
        setSpinner('登録中...');

        try {
            if (props.type === 'new') {
                // 新規登録
                const apiParam = Object.assign({
                    parent: props.param.parent,
                }, attrValue);
                await props.param.registContentAPI(apiParam);

            } else {
                // 更新
                const apiParam = Object.assign({
                    id: props.param.contentId,
                }, attrValue);
                if (apiParam.type === 'normal' && apiParam.imageUrl) {
                    // TODO:
                    apiParam.imageUrl = (apiParam.imageUrl === '/api/getthumb?id=' + props.param.contentId) ? undefined : apiParam.imageUrl;
                }
                await props.param.updateContentAPI(apiParam);
            }

            if (props.onClose) {
                props.onClose();
            }

        } catch(e) {
            console.warn(e);
            commandHook?.confirm({
                message: '登録に失敗しました。再度実行して、うまくいかない場合は管理者へご連絡ください。',
            });
        } finally {
            setSpinner(false);
        }

    }, [props, attrValue, commandHook]);

    const onCancel = useCallback(() => {
        if (props.onClose) {
            props.onClose();
        }
    }, [props]);

    const onChange = useCallback((value: ContentAttr) => {
        setAttrValue(value);
    }, []);

    const title = useMemo(() => {
        if (props.type ==='edit') {
            return 'コンテンツ編集';
        } else {
            return 'コンテンツ登録';
        }
    }, [props.type]);

    return (
        <Modal show={true} spinner={spinner}>
            <ModalHeader>
                {title}
            </ModalHeader>
            <ModalBody>
                <div className={styles.Content}>
                    <ContentInfoForm value={attrValue}
                        getSnsPreviewAPI={props.param.getSnsPreviewAPI} onChange={onChange} />
                </div>
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" onClick={onOk}>OK</Button>
            </ModalFooter>
        </Modal>
);
}