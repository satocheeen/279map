import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../../common/modal/Modal';
import Button from '../../common/button/Button';
import ContentInfoForm from './ContentInfoForm';
import SelectUnpointDataList from '../SelectUnpointDataList';
import styles from './ContentInfoEditDialog.module.scss';
import { RootState, useAppDispatch } from '../../../store/configureStore';
// import useConfirm from '../../common/confirm/useConfirm';
import { addListener, EditContentInfoParam, removeListener } from '../../../util/Commander';
import { api } from '279map-common';
import { UnpointContent } from '279map-common';
import { useSpinner } from '../../common/spinner/useSpinner';
import { getContents } from '../../../store/data/dataUtility';
import { useSelector } from 'react-redux';
import { linkContentToItem, registContent, updateContent } from '../../../store/data/dataThunk';

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
    // const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const itemMap = {};
    const [param, setParam] = useState<EditContentInfoParam>();
    // // 新規登録の場合、親itemId/contentId。編集の場合、contentId。
    // const [ id, setId ] = useState<string>('');
    // const { confirm } = useConfirm();
    const spinnerHook = useSpinner();
    // イベントリスナーの中で使用するため、refに格納
    const itemMapRef = useRef<typeof itemMap>();
    itemMapRef.current = itemMap;
    const dispatch = useAppDispatch();
    const mapServer = useSelector((state: RootState) => state.session.mapServer);

    /**
     * 初期化。
     * アイテムの編集コマンドがキックされたら、
     * 当該モーダルを表示する。
     */
    useEffect(() => {
        const h = addListener('EditContentInfo', async(param: EditContentInfoParam) => {
            if (!itemMapRef.current) {
                return;
            }
            setParam(param);
            if (param.operation === 'edit') {
                // 編集の場合は既存コンテンツをロード
                const contents = (await getContents(mapServer, [{
                    contentId: param.contentId,
                }]));
                if (!contents || contents?.length === 0) {
                    return;
                }
                const content = contents[0];
                const attrValue: api.ContentAttr = content.url ? {
                    title: content.title,
                    overview: content.overview ?? '',
                    categories: content.category ?? [],
                    type: 'sns',
                    url: content.url,
                } : {
                    title: content.title,
                    overview: content.overview ?? '',
                    categories: content.category ?? [],
                    type: 'normal',
                    date: content.date?.toString(),
                    imageUrl: content.image ? '/api/getthumb?id=' + content.id : undefined,
                };
                setAttrValue(attrValue);
            }
            setShow(true);
        });

        return () => {
            removeListener(h);
        }

    }, [dispatch, mapServer]);

    const currentMode = useMemo(() => {
        if (!param || param.operation === 'edit') {
            return Mode.Manual;
        }
        if (param.mode === 'manual') {
            return Mode.Manual;
        } else {
            return Mode.UnpointContent;
        }
    }, [param]);

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
        if (!param) {
            return;
        }
        spinnerHook.showSpinner('登録中...');

        try {
            if (param.operation === 'new') {
                if (currentMode === Mode.Manual) {
                    // 新規登録
                    const apiParam = Object.assign({
                        parent: param.parent,
                    }, attrValue);
                    await dispatch(registContent(apiParam));

                } else {
                    // 未配置コンテンツを紐づける場合
                    if (!unpointContentId) {
                        console.warn('unpointContentId undefined');
                        return;
                    }
                    await dispatch(linkContentToItem({
                        parent: param.parent,
                        childContentId: unpointContentId,
                    }));
                }

            } else {
                // 更新
                const apiParam = Object.assign({
                    id: param.contentId,
                }, attrValue);
                if (apiParam.type === 'normal' && apiParam.imageUrl) {
                    apiParam.imageUrl = (apiParam.imageUrl === '/api/getthumb?id=' + param.contentId) ? undefined : apiParam.imageUrl;
                }
                await dispatch(updateContent(apiParam));
            }

            setShow(false);

        } catch(e) {
            console.warn(e);
            // confirm({
            //     message: '登録に失敗しました。再度実行して、うまくいかない場合は管理者へご連絡ください。',
            // });
        } finally {
            spinnerHook.hideSpinner();
        }

    }, [attrValue, /*confirm, */ spinnerHook, currentMode, dispatch, param, unpointContentId]);

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
        if (param?.operation==='edit') {
            return 'コンテンツ編集';
        } else {
            return 'コンテンツ登録';
        }
    }, [param]);

    return (
        <Modal show={isShow}>
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