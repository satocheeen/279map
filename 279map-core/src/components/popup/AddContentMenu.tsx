import React, { useRef, useState, useCallback, useContext, useMemo, useEffect } from 'react';
import { MdOutlineLibraryAdd } from 'react-icons/md';
import { LinkUnpointContentParam } from '../../types/types';
import Tooltip from '../common/tooltip/Tooltip';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import PopupMenuIcon from './PopupMenuIcon';
import styles from './AddContentMenu.module.scss';
import { Auth, DataId, DataSourceLinkableContent, MapKind } from '279map-common';
import { getMapKey } from '../../store/data/dataUtility';
import { GetSnsPreviewAPI, GetUnpointDataAPI, LinkContentToItemAPI, LinkContentToItemParam, RegistContentAPI, RegistContentParam } from 'tsunagumap-api';
import { useMap } from '../map/useMap';
import { Button } from '../common';
import { useRecoilValue } from 'recoil';
import { itemMapState } from '../../store/data/dataAtom';
import { compareAuth } from '../../util/CommonUtility';
import { dataSourcesState } from '../../store/datasource';
import { connectStatusState, currentMapKindState } from '../../store/session';

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
    const itemMap = useRecoilValue(itemMapState);
    const { getApi } = useMap();
    const mapKind = useRecoilValue(currentMapKindState);
    const dataSources = useRecoilValue(dataSourcesState);
    const connectStatus = useRecoilValue(connectStatusState);

    const editableAuthLv = useMemo(() => {
        const authLv = connectStatus.mapDefine.authLv;
        return compareAuth(authLv, Auth.Edit) >= 0;
    }, [connectStatus]);

    /**
     * 追加可能なコンテンツ定義を返す
     */
    const addableContentDefines = useMemo((): DataSourceLinkableContent[] => {
        // 対象のデータソース情報取得
        let dataSourceId: string;
        if ('itemId' in props.target) {
            dataSourceId = props.target.itemId.dataSourceId;
        } else {
            dataSourceId = props.target.contentId.dataSourceId;
        }
        const dataSource = dataSources.find(ds => ds.dataSourceId === dataSourceId);
        if (!dataSource) {
            console.warn('想定外 target dataSource not find.', dataSourceId);
            return [];
        }

        if ('contentId' in props.target && props.target.isSnsContent) {
            // SNS自動連携コンテンツは子コンテンツ追加不可
            return [];
        }

        // 追加可能なコンテンツ定義を取得
        const linkableContents: DataSourceLinkableContent[] = [];
        if ('itemId' in props.target) {
            if (mapKind === MapKind.Real && dataSource.itemContents.RealItem) {
                Array.prototype.push.apply(linkableContents, dataSource.itemContents.RealItem.linkableContents);
            }
            if (mapKind === MapKind.Virtual && dataSource.itemContents.VirtualItem) {
                Array.prototype.push.apply(linkableContents, dataSource.itemContents.VirtualItem.linkableContents);
            }
        } else {
            if (dataSource.itemContents.Content) {
                Array.prototype.push.apply(linkableContents, dataSource.itemContents.Content.linkableContents);
            }
        }

        if (linkableContents.length === 0) {
            return [];
        }
        // 追加余地のあるコンテンツ定義に絞る
        return linkableContents.filter(def => {
            if (def.max === 'multi') return true;
    
            // linkableContent.Singleの場合は、
            // 同一データソースの既存コンテンツが存在しない場合のみOK
            if ('itemId' in props.target) {
                const item = itemMap[getMapKey(props.target.itemId)];
                const exist = item?.contents.some(content => content.id.dataSourceId === def.contentDatasourceId);
                return !exist;
            } else {
                const exist = props.target.children.some(child => child.dataSourceId === def.contentDatasourceId);
                return !exist;
            }
        });

    }, [itemMap, props.target, dataSources, mapKind]);

    const creatableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                // 追加対象データソースに絞る
                .filter(ds => {
                    return addableContentDefines.some(def => {
                        const addable = def.contentDatasourceId === ds.dataSourceId && def.max === 'multi';
                        if (!addable) return false;
                        // コンテンツデータソースが編集可能でなければ、新規追加は不可能
                        const target = dataSources.find(source => source.dataSourceId === def.contentDatasourceId);
                        if (!target?.itemContents.Content?.editable) return false;

                        return true;
                    });
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources, addableContentDefines]);
    const linkableContentDataSources = useMemo((): LinkUnpointContentParam['dataSources'] => {
        return dataSources
                // 追加対象データソースに絞る
                .filter(ds => {
                    const target = addableContentDefines.find(def => def.contentDatasourceId === ds.dataSourceId);
                    return target?.max === 'multi';
                })
                .map(ds => {
                    return {
                        dataSourceId: ds.dataSourceId,
                        name: ds.name,
                    }
                });
    }, [dataSources, addableContentDefines]);

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

    const onAddContent = useCallback((val: 'new' | 'unpoint') => {
        setShowSubMenu(false);
        if (val === 'new') {
            onAddNewContent({
                parent: props.target,
                dataSources: creatableContentDataSources,
                registContentAPI: async(param: RegistContentParam) => {
                    try {
                        await getApi().callApi(RegistContentAPI, param);
                    } catch(e) {
                        throw new Error('registContentAPI failed.' + e);
                    }
                },
                getSnsPreviewAPI: async(url: string) => {
                    const res = await getApi().callApi(GetSnsPreviewAPI, {
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
                    const result = await getApi().callApi(GetUnpointDataAPI, {
                        dataSourceId,
                        nextToken,
                    });
                    return result;
                },
                linkContentToItemAPI: async(param: LinkContentToItemParam) => {
                    await getApi().callApi(LinkContentToItemAPI, param);
                },
            });
        }

        if (props.onClick) {
            props.onClick();
        }

    }, [getApi, props, creatableContentDataSources, linkableContentDataSources, onAddNewContent, onLinkUnpointedContent]);

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
        if (addableContentDefines.length === 0 || !editableAuthLv) {
            return items;
        }
        if (creatableContentDataSources.length > 0) {
            items.push({
                name: '新規コンテンツ',
                callback: () => onAddContent('new'),
            });
        }
        if (linkableContentDataSources.length > 0) {
            items.push({
                name: '既存コンテンツ',
                callback: () => onAddContent('unpoint'),
            });
        }
        return items;
    }, [editableAuthLv, onAddContent, creatableContentDataSources, linkableContentDataSources, addableContentDefines]);

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