import React, { ReactNode, useCallback, useMemo, useState, useContext } from "react";
import { UrlType } from "../../types/types";
import styles from './Content.module.scss';
import { MdEdit, MdOutlineOpenInNew, MdDelete } from 'react-icons/md';
import dayjs from "dayjs";
import CategoryBadge from "../common/CategoryBadge";
import * as CommonUtility from '../../util/CommonUtility';
import { CgArrowsExchangeAlt } from "react-icons/cg";
import useConfirm from "../common/confirm/useConfirm";
import reactStringReplace from "react-string-replace";
import PopupMenuIcon from "../popup/PopupMenuIcon";
import AddContentMenu from "../popup/AddContentMenu";
import { Auth, ContentAttr, ContentsDefine, DataId, MapKind } from "279map-common";
import Spinner from "../common/spinner/Spinner";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";
import MyThumbnail from "../common/image/MyThumbnail";
import { getMapKey, isEqualId } from "../../util/dataUtility";
import { GetContentsAPI, GetImageUrlAPI, GetSnsPreviewAPI, RemoveContentAPI, UpdateContentAPI, UpdateContentParam } from 'tsunagumap-api';
import { useMap } from "../map/useMap";
import { authLvAtom, currentMapKindAtom } from "../../store/session";
import { filteredContentIdListAtom } from "../../store/filter";
import { useAtom } from 'jotai';
import { categoriesAtom } from "../../store/category";
import { ConfirmBtnPattern, ConfirmResult } from "../common/confirm/types";
import { useMapController } from "../../store/useMapController";
import { useApi } from "../../api/useApi";
import { useAtomCallback } from "jotai/utils";
import { dialogTargetAtom } from "../../store/operation";

type Props = {
    itemId: DataId;
    parentContentId?: DataId;
    content: ContentsDefine;
    onClick?: () => void;
}
/**
 * 詳細ダイアログに表示するコンテンツ。
 * 親子コンテンツを全て表示する。
 * @param props 
 * @returns 
 */
export default function Content(props: Props) {
    const { confirm } = useConfirm();
    const [ filteredContentIdList ] = useAtom(filteredContentIdListAtom);
    const { onEditContent }  = useContext(OwnerContext);
    const { focusItem } = useMap();
    const { callApi } = useApi();

    /**
     * 表示対象コンテンツかどうか。
     * （フィルタが掛かっている場合に、フィルタ対象のコンテンツのみを表示する）
     */
    const isShow = useMemo(() => {
        if (!filteredContentIdList) {
            return true;
        }
        return filteredContentIdList.some(target => isEqualId(target, props.content.id));
    }, [filteredContentIdList, props.content]);

    const urlType = useMemo(() => {
        return props.content.url ? CommonUtility.getUrlType(props.content.url) : undefined;
    }, [props.content]);

    const onClick = useCallback(() => {
        switch(urlType) {
            case UrlType.FacebookVideo:
                break;
            default:
                window.open(props.content.url, getMapKey(props.content.id));
        }
        if(props.onClick !== undefined){
            props.onClick();
        }
    }, [props, urlType]);

    const icon = useMemo((): ReactNode => {
        if (urlType === UrlType.FacebookVideo) {
            return (
                <img src="/icon/film.svg" className={styles.Icon} alt="film icon" />
            )
        } else if (urlType === UrlType.Note) {
            return (
                <img src="/icon/note_logo_symbol.svg" width="36" height="36" alt="note logo" />
            )
        } else {
            return (
                <MdOutlineOpenInNew />
            )
        }
    }, [urlType]);

    const title = useMemo(() => {
        if (props.content.url) {
            return (
                <span className={styles.Link} onClick={onClick}>
                    <span className={styles.IconArea}>
                        {icon}
                    </span>
                    <span>
                        {props.content.title}
                    </span>
                </span>
            )
        } else {
            return (
                <span>
                    {props.content.title}
                </span>
            )
        }
    }, [props.content, icon, onClick]);

    const [ categories ] = useAtom(categoriesAtom);

    const categoryTag = useMemo(() => {
        return props.content.category?.map(category => {
            return (
                <CategoryBadge key={category} category={category} existCategories={categories} />
            );
        });
    }, [props.content.category, categories]);

    const dateStr = useMemo(() => {
        if (!props.content.date) {
            return null;
        }
        return dayjs(props.content.date).format('YYYY/MM/DD HH:mm');
    }, [props.content]);

    /**
     * 別の地図で見る
     */
    const existAnoterMap = useMemo(() => {
        return props.content.anotherMapItemId;
    }, [props.content]);

    const [ mapKind ] = useAtom(currentMapKindAtom);

    const toolTipMessage = useMemo(() => {
        const mapName = mapKind === MapKind.Real ? '村マップ' : '世界地図';
        return mapName + 'で見る';
    }, [mapKind]);

    const { changeMapKind } = useMapController();
    const onGoToAnotherMap = useAtomCallback(
        useCallback(async(get, set) => {
            if (!props.content.anotherMapItemId) {
                console.warn('別地図にアイテムなし');
                return;
            }
            const anotherMap = mapKind === MapKind.Real ? MapKind.Virtual : MapKind.Real;

            await changeMapKind(anotherMap);
            focusItem(
                {
                    itemId: props.content.anotherMapItemId,
                }
            );
            set(dialogTargetAtom, {
                type: 'item',
                id: props.content.anotherMapItemId,
            })
        }, [mapKind, props.content.anotherMapItemId, changeMapKind, focusItem])
    );

    /**
     * イメージロード
     */
    const [showProcessMessage, setShowSpinner] = useState(false);
    const onImageClick = useCallback(async() => {
        setShowSpinner(true);
        try {
            const imageUrl = await callApi(GetImageUrlAPI, {
                id: props.content.id,
            });
            window.open(imageUrl, 'image' + props.content.id);
        } catch(e) {
            console.warn('getImageUrl failed.', e);
        } finally {
            setShowSpinner(false);
        }
    }, [props.content.id, callApi]);

    const onEdit = useCallback(async() => {
        // 編集対象コンテンツをロード
        const contents = (await callApi(GetContentsAPI, [{
            contentId: props.content.id,
        }])).contents;
        if (!contents || contents?.length === 0) {
            return;
        }
        const content = contents[0];
        const currentAttr: ContentAttr = content.url ? {
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
        onEditContent({
            contentId: props.content.id,
            currentAttr,
            getSnsPreviewAPI: async(url: string) => {
                const res = await callApi(GetSnsPreviewAPI, {
                    url,
                });
                return res;
            },
            updateContentAPI: async(param: UpdateContentParam) => {
                await callApi(UpdateContentAPI, param);
        
            },
        })
    }, [props.content, onEditContent, callApi]);

    const onDelete = useCallback(async() => {
        const result = await confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }
        let deleteOnlyLink = true;
        if (props.content.isDeletable) {
            const result2 = await confirm({
                message: '完全に削除しますか。\nはい→完全に削除する\nいいえ→地図上からのみ削除する（後から割り当て可能）',
                btnPattern: ConfirmBtnPattern.YesNo,
            });
            if (result2 === ConfirmResult.Cancel) {
                return;
            }
            deleteOnlyLink = result2 === ConfirmResult.No;
        }

        setShowSpinner(true);

        try {
            await callApi(RemoveContentAPI, {
                id: props.content.id,
                itemId: props.itemId,
                parentContentId: props.parentContentId,
                mode: deleteOnlyLink ? 'unlink' : 'alldelete',
            });
    
        } catch(e) {
            confirm({
                message: '削除に失敗しました。\n' + e,
                btnPattern: ConfirmBtnPattern.OkOnly,
            });

        } finally {
            setShowSpinner(false);

        }

    }, [callApi, props.itemId, props.parentContentId, confirm, props.content]);

    const overview = useMemo(() => {
        if (!props.content.overview) {
            return null;
        }

        // 改行
        let i = 0;
        let newContent = reactStringReplace(props.content.overview, '\n', () => {
            return <br key={'br-' + i++}/>;
        });
        
        // URL文字列をリンクに変更
        const regExp = /(https?:\/\/\S+)/g;
        i = 0;
        return reactStringReplace(newContent, regExp, (match) => {
            return (
                <a href={match} rel="noopener noreferrer" key={'a-' + i++} target="_blank">
                    {match}
                    <i className="icon-external-link" />
                </a>
            );
        }
        );

    }, [props.content.overview]);

    const [authLv] = useAtom(authLvAtom);
    const editable = useMemo(() => {
        return props.content.isEditable && CommonUtility.compareAuth(authLv, Auth.Edit) >= 0
    }, [authLv, props.content]);

    const deletable = useMemo(() => {
        return CommonUtility.compareAuth(authLv, Auth.Edit) >= 0
    }, [authLv]);

    const header = useMemo(() => {
        return (
            <div className={styles.ItemHeader}>
                <span className={styles.Title}>
                    {title}
                </span>
                <div className={styles.IconAreas}>
                    {editable &&
                        <PopupMenuIcon tooltip='編集' onClick={onEdit}>
                            <MdEdit />
                        </PopupMenuIcon>
                    }
                    {deletable &&
                        <PopupMenuIcon tooltip="削除" onClick={onDelete}>
                            <MdDelete />
                        </PopupMenuIcon>
                    }
                    {/* {addableChild && */}
                        <AddContentMenu target={{contentId: props.content.id, isSnsContent: props.content.isSnsContent, children: (props.content.children ?? []).map(c => c.id)}} />
                    {/* } */}
                    {existAnoterMap &&
                        <PopupMenuIcon tooltip={toolTipMessage} onClick={onGoToAnotherMap}>
                            <CgArrowsExchangeAlt />
                        </PopupMenuIcon>
                    }
                </div>
            </div>
        )
    }, [props.content, title, onGoToAnotherMap, existAnoterMap, onDelete, onEdit, toolTipMessage, deletable, editable]);

    const body = useMemo(() => {
        return (
            <>
                {overview &&
                    <p className={styles.Overview}>{overview}</p>
                }
                {dateStr && 
                    <span className={styles.Date}>{dateStr}</span>
                }
                {categoryTag}
                {showProcessMessage &&
                    <div className={styles.SpinnerArea}>
                        <Spinner />
                    </div>
                }
                {
                    props.content.image &&
                        <div className={styles.ImageContainer}>
                            <MyThumbnail mode='original' className={styles.Image} id={props.content.id} onClick={onImageClick} alt="contents"/>
                        </div>
                }
                {
                    props.content.videoUrl &&
                        <div className={styles.ImageContainer}>
                            <video className={styles.Video} src={props.content.videoUrl} controls playsInline />
                        </div>
                }
            </>
        )
    }, [overview, dateStr, categoryTag, showProcessMessage, props.content, onImageClick]);

    const children = useMemo(() => {
        return props.content.children?.map(child => {
            return (
                <Content key={getMapKey(child.id)} itemId={props.itemId} parentContentId={props.content.id} content={child} />
            )
        })
    }, [props.content, props.itemId]);

    if (isShow) {
        return (
            <div className={styles.Item}>
                {header}
                {body}
                {children}
            </div>
        )
    } else {
        return (
            <>
                {children}
            </>
        );
    }
}