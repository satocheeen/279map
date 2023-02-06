import React, { ReactNode, useCallback, useMemo, useState, useContext } from "react";
import { UrlType } from "../../types/types";
import styles from './Content.module.scss';
import { MdEdit, MdOutlineOpenInNew, MdDelete } from 'react-icons/md';
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import CategoryBadge from "../common/CategoryBadge";
import * as CommonUtility from '../../util/CommonUtility';
import { CgArrowsExchangeAlt } from "react-icons/cg";
import { doCommand } from "../../util/Commander";
import useConfirm, { ConfirmBtnPattern, ConfirmResult } from "../common/confirm/useConfirm";
import { removeContent } from "../../store/data/dataThunk";
import reactStringReplace from "react-string-replace";
import PopupMenuIcon from "../popup/PopupMenuIcon";
import AddContentMenu from "../popup/AddContentMenu";
import { Auth, ContentsDefine, MapKind } from "279map-common";
import { useAPI } from "../../api/useAPI";
import Spinner from "../common/spinner/Spinner";
import { operationActions } from "../../store/operation/operationSlice";
import { useFilter } from "../../store/useFilter";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";

type Props = {
    itemId: string;
    parentContentId?: string;
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
    const dispatch = useAppDispatch();
    const { apiUrl } = useAPI();
    const { filterTargetContentIds } = useFilter();
    const { onEditContentInfo } = useContext(OwnerContext);

    /**
     * 表示対象コンテンツかどうか。
     * （フィルタが掛かっている場合に、フィルタ対象のコンテンツのみを表示する）
     */
    const isShow = useMemo(() => {
        if (filterTargetContentIds === undefined) {
            return true;
        }
        return filterTargetContentIds.includes(props.content.id);
    }, [filterTargetContentIds, props.content]);

    const urlType = useMemo(() => {
        return props.content.url ? CommonUtility.getUrlType(props.content.url) : undefined;
    }, [props.content]);

    const imageUrl = useMemo(() => {
        if (props.content.image) {
            return `${apiUrl}getthumb?id=${props.content.id}`;
        } else {
            return undefined;
        }
    }, [props.content, apiUrl]);

    const onClick = useCallback(() => {
        switch(urlType) {
            case UrlType.FacebookVideo:
                break;
            default:
                window.open(props.content.url, props.content.id);
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

    const categories = useSelector((state: RootState) => state.data.categories);

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

    const mapKind = useSelector((state: RootState) => state.session.currentMapKindInfo?.mapKind);

    const toolTipMessage = useMemo(() => {
        const mapName = mapKind === MapKind.Real ? '村マップ' : '世界地図';
        return mapName + 'で見る';
    }, [mapKind]);

    const onGoToAnotherMap = useCallback(() => {
        if (!props.content.anotherMapItemId) {
            console.warn('別地図にアイテムなし');
            return;
        }
        const anotherMap = mapKind === MapKind.Real ? MapKind.Virtual : MapKind.Real;
        dispatch(operationActions.setMapKind(anotherMap));
        dispatch(operationActions.setFocusItemId(props.content.anotherMapItemId));
        // TODO:
        // searchParams.set('kind', anotherMap);
        // searchParams.set('feature', props.content.anotherMapItemId);
        // setSearchParams(searchParams);
    }, [mapKind, props.content.anotherMapItemId, dispatch]);

    /**
     * イメージロード
     */
    const [showSpinner, setShowSpinner] = useState(false);
    const onImageClick = useCallback(async() => {
        const url = `${apiUrl}getimageurl?id=${props.content.id}`;
        setShowSpinner(true);
        try {
            const response = await fetch(url);
            if(!response.ok) {
                throw response.statusText;
            }
            const imageUrl = await response.text();
            window.open(imageUrl, 'image' + props.content.id);
        } catch(e) {
            console.warn('getImageUrl failed.', e);
        } finally {
            setShowSpinner(false);
        }
    }, [props.content.id, apiUrl]);

    const onEdit = useCallback(() => {
        doCommand({
            command: "EditContentInfo",
            param: props.content.id,
        });
    }, [props.content]);

    const editableAuthLv = useSelector((state: RootState) => {
        if (state.session.connectStatus.status !== 'connected') {
            return false;
        }
        return state.session.connectStatus.connectedMap?.authLv === Auth.Edit
    });
    const isEditable = useMemo(() => {
        if (!editableAuthLv) return false;
        if (!onEditContentInfo) return false;

        // SNSコンテンツは編集不可
        return !props.content.isSnsContent;
    }, [editableAuthLv, onEditContentInfo, props.content]);

    const isDeletable = useMemo(() => {
        if (!editableAuthLv) return false;
        // SNSコンテンツは編集不可
        return !props.content.isSnsContent;
    }, [editableAuthLv, props.content]);

    const addableChild = useMemo(() => {
        if (!editableAuthLv) return false;
        return props.content.addableChild;
    }, [props.content, editableAuthLv]);

    const onDelete = useCallback(async() => {
        const result = await confirm({
            message: '削除してよろしいですか。'
        });
        if (result === ConfirmResult.Cancel) {
            return;
        }
        let deleteOnlyLink = true;
        if (!props.content.anotherMapItemId) {
            // もう一方の地図で使用されている場合は、アイテムとのリンク除去
            // 使用されていないならば、どうするか確認
            const result2 = await confirm({
                message: '元データも削除しますか。\nはい→元データごと削除する\nいいえ→地図上からのみ削除する',
                btnPattern: ConfirmBtnPattern.YesNo,
            });
            deleteOnlyLink = result2 === ConfirmResult.No;
        }

        setShowSpinner(true);

        await dispatch(removeContent({
            id: props.content.id,
            itemId: props.itemId,
            parentContentId: props.parentContentId,
            mode: deleteOnlyLink ? 'unlink' : 'alldelete',
        }));

        setShowSpinner(false);

    }, [props.itemId, props.parentContentId, confirm, dispatch, props.content.anotherMapItemId, props.content.id]);

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

    const header = useMemo(() => {
        return (
            <div className={styles.ItemHeader}>
                <span className={styles.Title}>
                    {title}
                </span>
                <div className={styles.IconAreas}>
                    {isEditable &&
                        <PopupMenuIcon tooltip='編集' onClick={onEdit}>
                            <MdEdit />
                        </PopupMenuIcon>
                    }
                    {isDeletable &&
                        <PopupMenuIcon tooltip="削除" onClick={onDelete}>
                            <MdDelete />
                        </PopupMenuIcon>
                    }
                    {addableChild &&
                        <AddContentMenu target={{contentId: props.content.id}} />
                    }
                    {existAnoterMap &&
                        <PopupMenuIcon tooltip={toolTipMessage} onClick={onGoToAnotherMap}>
                            <CgArrowsExchangeAlt />
                        </PopupMenuIcon>
                    }
                </div>
            </div>
        )
    }, [props.content, title, onGoToAnotherMap, addableChild, existAnoterMap, isEditable, isDeletable, onDelete, onEdit, toolTipMessage]);

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
                {showSpinner &&
                    <div className={styles.SpinnerArea}>
                        <Spinner />
                    </div>
                }
                {
                    imageUrl &&
                        <div className={styles.ImageContainer}>
                            <img className={styles.Image} src={imageUrl} onClick={onImageClick} alt="contents" />
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
    }, [overview, dateStr, categoryTag, showSpinner, imageUrl, props.content, onImageClick]);

    return (
        <div className={styles.Item}>
            {isShow &&
                <>
                    {header}
                    {body}
                </>
            }
            {
                props.content.children?.map(child => {
                    return (
                        <Content key={child.id} itemId={props.itemId} parentContentId={props.content.id} content={child} />
                    )
                })
            }
        </div>
    )
}