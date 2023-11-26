import React, { useRef, useState, useCallback, useContext, useMemo, useEffect } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { LinkUnpointContentParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';
import { Auth, DataId, DataSourceKindType } from '279map-common';
import { GetSnsPreviewAPI, GetUnpointDataAPI, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam, UpdateItemAPI } from 'tsunagumap-api';
import { Button } from '../common';
import { compareAuth } from '../../util/CommonUtility';
import { authLvAtom } from '../../store/session';
import { useItems } from '../../store/item/useItems';
import { contentDataSourcesAtom } from '../../store/datasource';
import { useAtom } from 'jotai';
import { useApi } from '../../api/useApi';
import useConfirm from '../common/confirm/useConfirm';
import { ConfirmBtnPattern, ConfirmResult } from '../common/confirm/types';
import { clientAtom } from 'jotai-urql';
import { GetContentDocument, GetUnpointContentsDocument } from '../../graphql/generated/graphql';

type Props = {
    target: {
        itemId: DataId;
    } | {
        contentId: DataId;
        isSnsContent: boolean;
        children: DataId[];
    };
    style?: 'icon' | 'button';  // default='icon'
    onClick?: () => void;   // メニュー選択時のコールバック
}
let maxId = 0;
export default function AddContentMenu(props: Props) {
    const id = useRef('add-content-menu-'+maxId++);
    const { onAddNewContent, onLinkUnpointedContent } = useContext(OwnerContext);
    const [ isShowSubMenu, setShowSubMenu] = useState(false);
    const { callApi } = useApi();
    const [ dataSources ] = useAtom(contentDataSourcesAtom);
    const [ authLv ] = useAtom(authLvAtom);
    const { getItem } = useItems();

    const item = useMemo(() => {
        if ('itemId' in props.target) {
            return getItem(props.target.itemId);
        } else {
            return undefined;
        }

    }, [props.target, getItem]);

    const editableAuthLv = useMemo(() => {
        return compareAuth(authLv, Auth.Edit) >= 0;
    }, [authLv]);

    /**
     * 追加可能なコンテンツ定義を返す
     */
    const addableContentDatasources = useMemo((): string[] => {
        if ('contentId' in props.target && props.target.isSnsContent) {
            // SNS自動連携コンテンツは子コンテンツ追加不可
            return [];
        }

        // 追加可能なコンテンツ定義を取得
        if ('itemId' in props.target) {
            return dataSources
                .filter(ds => ds.editable)
                .map(ds => {
                    return ds.dataSourceId;
                });
        }
        const targetId = props.target.contentId;
        const targetDs = dataSources.find(ds => ds.dataSourceId === targetId.dataSourceId);
        if (targetDs?.kind === DataSourceKindType.Content) {
            if (!targetDs.linkableChildContents) {
                return [];
            } else {
                return [targetDs.dataSourceId];
            }
        } else if (targetDs?.kind === DataSourceKindType.RealPointContent) {
            if (!targetDs.linkableContents) {
                return [];
            } else {
                return [targetDs.dataSourceId];
            }
        } else {
            return [];
        }

    }, [props.target, dataSources]);

    const creatableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                // 追加対象データソースに絞る
                .filter(ds => {
                    return addableContentDatasources.some(addableDs => {
                        const addable = addableDs === ds.dataSourceId;
                        if (!addable) return false;
                        // コンテンツデータソースが編集可能でなければ、新規追加は不可能
                        const target = dataSources.find(source => source.dataSourceId === addableDs);
                        if (!target?.editable) return false;

                        return true;
                    });
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources, addableContentDatasources]);
    const linkableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                // 追加対象データソースに絞る
                .filter(ds => {
                    const target = addableContentDatasources.find(addableDs => addableDs === ds.dataSourceId);
                    return target;
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources, addableContentDatasources]);

    /**
     * ツールチップメニュー表示時にエリア外クリックすると、ツールチップメニューを非表示にする
     */
    useEffect(() => {
        const func = () => {
            if (isShowSubMenu) {
                setShowSubMenu(false);
            }
        }
        if (isShowSubMenu) {
            window.document.addEventListener('click', func);
        }
        return () => {
            window.document.removeEventListener('click', func);
        }
    }, [isShowSubMenu]);

    const { confirm } = useConfirm();
    const [ gqlClient ] = useAtom(clientAtom);

    type FuncParam = {
        type: 'id';
        contentId: DataId;
    } | {
        type: 'title';
        contentTitle: string;
    }
    const registItemNameByContentsName = useCallback(async(param: FuncParam) => {
        if (item?.name.length !== 0) return;

        const yesno = await confirm({
            message: '建物の名前にコンテンツ名を設定しますか？',
            btnPattern: ConfirmBtnPattern.YesNo,
            title: '確認',
        });
        if (yesno !== ConfirmResult.Yes) return;

        let name: string;
        if (param.type === 'id') {
            const getContent = await gqlClient.query(GetContentDocument, {
                id: param.contentId,
            });
            const content = getContent.data?.getContent;
            if (!content) {
                console.warn('コンテンツなし');
                return;
            }
            name = content.title;
        } else {
            name = param.contentTitle;
        }

        await callApi(UpdateItemAPI, {
            targets: [
                {
                    id: item.id,
                    name,
                }
            ]
        });

    }, [item, callApi, confirm, gqlClient]);

    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        setShowSubMenu(false);
        if (val === 'new') {
            onAddNewContent({
                parent: props.target,
                dataSources: creatableContentDataSources,
                registContentAPI: async(param: RegistContentParam) => {
                    try {
                        await callApi(RegistContentAPI, param);
                        // 必要に応じてアイテム名設定
                        registItemNameByContentsName({
                            type: 'title',
                            contentTitle: param.title,
                        });
                    } catch(e) {
                        throw new Error('registContentAPI failed.' + e);
                    }
                },
                getSnsPreviewAPI: async(url: string) => {
                    const res = await callApi(GetSnsPreviewAPI, {
                        url,
                    });
                    return res;
                },
            });
        } else {
            onLinkUnpointedContent({
                parent: props.target,
                dataSources: linkableContentDataSources,
                getUnpointDataAPI: async(dataSourceId: string, nextToken?: string) => {
                    const result = await gqlClient.query(GetUnpointContentsDocument, {
                        dataSourceId,
                        nextToken,
                    })
                    if (!result.data) {
                        throw new Error('getUnpoinData error', result.error);
                    }
                    return result.data?.getUnpointContents;
                },
                linkContentToItemAPI: async(param: LinkContentToItemParam) => {
                    try {
                        await callApi(LinkContentToItemAPI, param);

                        // 必要に応じてアイテム名設定
                        registItemNameByContentsName({
                            type: 'id',
                            contentId: param.childContentId
                        });

                    } catch(e) {
                        console.warn(e);
                        confirm({
                            message: 'コンテンツ登録に失敗しました。再度やり直して問題解決しない場合は管理者へ連絡してください。',
                            btnPattern: ConfirmBtnPattern.OkOnly,
                            title: 'エラー',
                        })
                    }
                },
            });
        }

        if (props.onClick) {
            props.onClick();
        }

    }, [callApi, props, confirm, registItemNameByContentsName, creatableContentDataSources, linkableContentDataSources, onAddNewContent, onLinkUnpointedContent, gqlClient]);

    const caption = useMemo(() => {
        if ('itemId' in props.target) {
            return 'コンテンツ追加';
        } else {
            return '子コンテンツ追加';
        }
    }, [props]);

    const subMenuItems = useMemo(() => {
        const items = [] as {
            name: string;
            callback: () => void;
        }[];
        console.log('editableAuthLv', editableAuthLv);
        console.log('creatableContentDataSources', creatableContentDataSources);
        if (creatableContentDataSources.length > 0) {
            items.push({
                name: '新規コンテンツ',
                callback: () => onAddContent('new'),
            });
        }
        console.log('linkableContentDataSources', linkableContentDataSources);
        if (linkableContentDataSources.length > 0) {
            items.push({
                name: '既存コンテンツ',
                callback: () => onAddContent('unpoint'),
            });
        }
        return items;
    }, [editableAuthLv, onAddContent, creatableContentDataSources, linkableContentDataSources]);

    const onClick = useCallback((evt?: React.MouseEvent) => {
        if (evt) evt.stopPropagation();
        setShowSubMenu((state) => !state);
    }, []);

    if (subMenuItems.length === 0) {
        return null;
    } else if (subMenuItems.length === 1) {
        const style = props.style ?? 'icon';

        if (style === 'icon') {
            return (
                <PopupMenuIcon id={id.current} tooltip={caption} onClick={subMenuItems[0].callback}>
                    <MdOutlineLibraryAdd />
                </PopupMenuIcon>
            )
        } else {
            return (
                <Button variant='secondary' onClick={subMenuItems[0].callback}>{caption}</Button>
            )
        }
    } else {
        const style = props.style ?? 'icon';
        return (
            <>
                {style === 'icon' ?
                    <PopupMenuIcon id={id.current} tooltip={caption} onClick={onClick}>
                        <MdOutlineLibraryAdd />
                    </PopupMenuIcon>
                    :
                    <Button id={id.current} variant='secondary' onClick={onClick}>{caption}</Button>

                }
                <Tooltip anchorId={id.current} place='right' isOpen={isShowSubMenu}
                    onHide={() => {setShowSubMenu(false)}} name="addContents">
                    <ul className={styles.SubMenu}>
                        { subMenuItems.map((item, index) => {
                            return (
                                <li key={index} onClick={item.callback}>{item.name}</li>
                            )
                        })}
                    </ul>
                </Tooltip>
            </>
        )
    }
}