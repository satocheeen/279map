import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../common/modal/Modal';
import Button from '../../common/button/Button';
import ContentInfoForm from './ContentInfoForm';
import SelectUnpointDataList from '../SelectUnpointDataList';
import styles from './ContentInfoEditDialog.module.scss';
// import useConfirm from '../../common/confirm/useConfirm';
import { doCommand, NewContentInfoParam } from '../../../util/Commander';
import { api } from '279map-common';
import { UnpointContent } from '279map-common';

type Props = {
    initialValue?: api.ContentAttr;
    onOk?: (value: AttrResult) => void;
    onCancel?: () => void;
    onClose?: () => void;
}
export type AttrResult = {
    // 位置未指定コンテンツを指定した場合
    type: 'unpoint-content';
    id: string;
} | {
    // 属性手入力した場合
    type: 'manual';
    value: api.ContentAttr;
}
enum Mode {
    Manual,
    UnpointContent,
}

type Target = {
    type: 'new';
    param: NewContentInfoParam;
} | {
    type: 'edit';
    contentId: string;
}
/**
 * アイテム情報登録・編集コンポーネント
 */
export default function ContentInfoEditDialog(props: Props) {
    const [isShow, setShow] = useState(false);
    const [attrValue, setAttrValue] = useState<api.ContentAttr>({
        title: '',
        overview: '',
        type: 'normal',
        categories: [],
    });
    const [unpointContentId, setUnpointContentId] = useState<string>();
    const itemMap = {};
    const [target, setTarget] = useState<Target>();
    // const { confirm } = useConfirm();
    // イベントリスナーの中で使用するため、refに格納
    const itemMapRef = useRef<typeof itemMap>();
    itemMapRef.current = itemMap;
    const [ spinner, setSpinner ] = useState<false|string>(false);

    /**
     * 初期化。
     * アイテムの編集コマンドがキックされたら、
     * 当該モーダルを表示する。
     */
    useEffect(() => {

        // const hNew = addListener('NewContentInfo', async(param: NewContentInfoParam) => {
        //     setTarget({
        //         type: 'new',
        //         param,
        //     });
        //     setShow(true);
        // });
        // const hEdit = addListener('EditContentInfoWithAttr', async(param: EditContentInfoWithAttrParam) => {
        //     setTarget({
        //         type: 'edit',
        //         contentId: param.contentId,
        //     });
        //     setAttrValue(param.attr);
        //     setShow(true);
        // });

        // return () => {
        //     removeListener(hNew);
        //     removeListener(hEdit);
        // }

    }, []);

    const currentMode = useMemo(() => {
        if (!target || target.type === 'edit') {
            return Mode.Manual;
        }
        if (target.param.mode === 'manual') {
            return Mode.Manual;
        } else {
            return Mode.UnpointContent;
        }
    }, [target]);

    useEffect(() => {
        if (!isShow) {
            // 閉じる際に値クリア
            setAttrValue({
                title: '',
                overview: '',
                type: 'normal',
                categories: [],
            });
        }

    }, [isShow]);

    useEffect(() => {
        if (!props.initialValue) return;
        setAttrValue(props.initialValue);
    }, [props.initialValue]);

    const onOk = useCallback(async() => {
        if (!target) {
            return;
        }
        setSpinner('登録中...');

        try {
            if (target?.type === 'new') {
                if (currentMode === Mode.Manual) {
                    // 新規登録
                    const apiParam = Object.assign({
                        parent: target.param.parent,
                    }, attrValue);
                    await doCommand({
                        command: 'RegistContent',
                        param: apiParam,
                    });

                } else {
                    // 未配置コンテンツを紐づける場合
                    if (!unpointContentId) {
                        console.warn('unpointContentId undefined');
                        return;
                    }
                    await doCommand({
                        command: 'LinkContentToItem',
                        param: {
                            parent: target.param.parent,
                            childContentId: unpointContentId,
                        }
                    });
                }

            } else {
                // 更新
                const apiParam = Object.assign({
                    id: target.contentId,
                }, attrValue);
                if (apiParam.type === 'normal' && apiParam.imageUrl) {
                    apiParam.imageUrl = (apiParam.imageUrl === '/api/getthumb?id=' + target.contentId) ? undefined : apiParam.imageUrl;
                }
                await doCommand({
                    command: 'UpdateContent',
                    param: apiParam,
                });
            }

            setShow(false);

        } catch(e) {
            console.warn(e);
            // confirm({
            //     message: '登録に失敗しました。再度実行して、うまくいかない場合は管理者へご連絡ください。',
            // });
        } finally {
            setSpinner(false);
        }

    }, [attrValue, /*confirm, */ currentMode, target, unpointContentId]);

    const onCancel = useCallback(() => {
        if (props.onCancel) {
            props.onCancel();
        }
        setShow(false);
    }, [props]);

    const onChange = useCallback((value: api.ContentAttr) => {
        setAttrValue(value);
    }, []);

    const onSelectUnpointData = useCallback((value: UnpointContent) => {
        setUnpointContentId(value.id);
    }, []);

    const okable = useMemo(() => {
        if (currentMode === Mode.Manual) {
            return true;
        } else {
            return unpointContentId !== undefined;
        }
    }, [currentMode, unpointContentId]);

    const title = useMemo(() => {
        if (target?.type ==='edit') {
            return 'コンテンツ編集';
        } else {
            return 'コンテンツ登録';
        }
    }, [target]);

    return (
        <Modal show={isShow} spinner={spinner}>
            <ModalHeader>
                {title}
            </ModalHeader>
            <ModalBody>
                <div className={styles.Content}>
                    {currentMode === Mode.Manual ?
                        <ContentInfoForm value={attrValue} onChange={onChange} />
                        :
                        <SelectUnpointDataList select={onSelectUnpointData} />
                    }
                </div>
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" disabled={!okable} onClick={onOk}>OK</Button>
            </ModalFooter>
        </Modal>
);
}