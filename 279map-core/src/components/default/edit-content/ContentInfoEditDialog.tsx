import React, { useCallback, useMemo, useRef, useState } from 'react';
import ContentInfoForm from './ContentInfoForm';
import styles from './ContentInfoEditDialog.module.scss';
import { AddNewContentParam, EditContentParam } from '../../../types/types';
import { ContentAttr } from '279map-common';
import { Button, Modal } from '../../common';
import useConfirm from '../../common/confirm/useConfirm';
import Select from '../../common/form/Select';
import { ConfirmBtnPattern } from '../../common/confirm/types';
import { modalSpinnerAtom } from '../../common/modal/Modal';
import { useAtomCallback } from 'jotai/utils';
import { ContentType, MutationUpdateContentArgs, ParentOfContent } from '../../../graphql/generated/graphql';

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
    const [attrValue, setAttrValue] = useState<ContentAttr>(
        props.type === 'new' ?
            {
                title: '',
                overview: '',
                type: 'normal',
                categories: [],
            }
            : props.param.currentAttr,
    );
    const itemMap = {};
    // イベントリスナーの中で使用するため、refに格納
    const itemMapRef = useRef<typeof itemMap>();
    itemMapRef.current = itemMap;
    // const [ spinner, setSpinner ] = useAtom(modalSpinnerAtom);
    const { confirm } = useConfirm();
    const [ contentDataSourceId, setContentDataSourceId ] = useState<string|undefined>(
        props.type === 'new' ? props.param.dataSources[0]?.dataSourceId : props.param.contentId.dataSourceId
    );

    const onOk = useAtomCallback(
        useCallback(async(get, set) => {
            if (!contentDataSourceId) {
                console.warn('想定外. データソースID未指定');
                return;
            }
            set(modalSpinnerAtom, '登録中...');

            try {
                if (props.type === 'new') {
                    // 新規登録
                    const { type, ...attr } = attrValue;
                    await props.param.registContentAPI({
                        parent: 'itemId' in props.param.parent ? {
                            type: ParentOfContent.Item,
                            id: props.param.parent.itemId,
                        } : {
                            type: ParentOfContent.Content,
                            id: props.param.parent.contentId,
                        },
                        dataSourceId: contentDataSourceId,
                        type: type === 'normal' ? ContentType.Normal : ContentType.Sns,
                        ...attr,
                    });

                } else {
                    // 更新
                    const apiParam = Object.assign({
                        id: props.param.contentId,
                    }, attrValue) as MutationUpdateContentArgs;
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
                confirm({
                    message: '登録に失敗しました。再度実行して、うまくいかない場合は管理者へご連絡ください。',
                    btnPattern: ConfirmBtnPattern.OkOnly,
                });
            } finally {
                set(modalSpinnerAtom, false);
            }

        }, [props, attrValue, confirm, contentDataSourceId])
    );

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

    const dataSourceItems = useMemo(() => {
        if (props.type === 'new') {
            return props.param.dataSources.map(ds => {
                return {
                    value: ds.dataSourceId,
                    name: ds.name,
                }
            })
        } else {
            return [];
        }
    }, [props.type, props.param]);

    return (
        <Modal show={true}>
            <Modal.Header>
                {title}
            </Modal.Header>
            <Modal.Body>
                {dataSourceItems.length > 1 &&
                    <Select items={dataSourceItems} value={contentDataSourceId} onSelect={(ds) => setContentDataSourceId(ds)} />
                }
                <div className={styles.Content}>
                    <ContentInfoForm value={attrValue}
                        getSnsPreviewAPI={props.param.getSnsPreviewAPI} onChange={onChange} />
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" onClick={onOk}>OK</Button>
            </Modal.Footer>
        </Modal>
);
}