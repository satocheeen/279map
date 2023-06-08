import React, { useContext, useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import styles from './PointsPopup.module.scss';
import { useFilter } from "../../store/useFilter";
import { ContentsDefine, DataId, ItemContentInfo, ItemDefine } from "279map-common";
import { operationActions } from "../../store/operation/operationSlice";
import SelectContentDialog from "./select-content/SelectContentDialog";
import { useContents } from "../../store/useContents";
import { MapMode } from "../../types/types";
import { getMapKey, isEqualId } from "../../store/data/dataUtility";
import MyThumbnail from "../common/image/MyThumbnail";
import { BsThreeDots } from 'react-icons/bs';
import { useMapOptions } from "../../util/useMapOptions";
import { doCommand } from "../../util/Commander";
import { OwnerContext } from "../TsunaguMap/TsunaguMap";

type Props = {
    // このポップアップにて情報表示する対象アイテム
    itemIds: DataId[];
}

export type PopupItem = {
    id: string;
    content?: ContentsDefine;
}

function hasImageItem(item: ItemDefine): boolean {
    if (item.contents.length===0) return false;
    if (item.contents.some(c => c.hasImage)) return true;
    const hasChildOwnImage = (children: ItemContentInfo[]): boolean => {
        return children.some(child => {
            if (child.hasImage) return true;
            return hasChildOwnImage(child.children);
        });
    }
    return hasChildOwnImage(item.contents);

}
export default function PointsPopup(props: Props) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const { isFiltered, filteredItemIdList, filteredContents } = useFilter();
    const { getDescendantContentsIdList } = useContents();

    /**
     * このポップアップで表示するアイテム情報
     */
    const target = useMemo(() => {
        if (props.itemIds.length === 0) {
            return undefined;
        }
        let infos = props.itemIds.reduce((acc, cur) => {
            const item = itemMap[getMapKey(cur)];
            if (!item) {
                // 地図種別切り替え直後にこのルートに入る可能性がある
                return acc;
            }
            return acc.concat(item);
        }, [] as ItemDefine[])
        // フィルタがかかっている場合は、フィルタ対象のものに絞る
        if (isFiltered) {
            infos = infos.filter(info => filteredItemIdList?.includes(info.id));
        }
        if (infos.length === 1) {
            return infos[0];
        }
        // 複数アイテムが表示対象の場合は、画像を持つもののみ表示対象
        const ownImageInfos = infos.filter(info => hasImageItem(info));
        if (ownImageInfos.length === 0) {
            // 画像を持つものがない場合は、冒頭
            return infos[0];
        }
        // 最初の画像のみ表示
        return ownImageInfos[0];
    }, [props.itemIds, itemMap, filteredItemIdList, isFiltered]);

    const { popupMode } = useMapOptions();

    // 表示する画像URL
    const imageContentId = useMemo((): DataId | null => {
        if (!target) return null;
        if (popupMode !== 'maximum') return null;

        const getImageOwnerContentId = (content: ItemContentInfo) : DataId | undefined => {
            const isVisible = !filteredContents || filteredContents.some(filteredId => isEqualId(filteredId, content.id));
            if (isVisible && content.hasImage) {
                return content.id;
            }
            let id: DataId | undefined;
            content.children?.some(child => {
                id = getImageOwnerContentId(child);
                return id ? true : false;
            });
            return id;
        }
        if (target.contents.length === 0) {
            return null;
        }
        let imageContentId: DataId | undefined ;
        for (const content of target.contents) {
            imageContentId = getImageOwnerContentId(content);
            if (imageContentId) {
                break;
            }
        }
        if (!imageContentId) {
            return null;
        }
        return imageContentId;

    }, [target, filteredContents, popupMode]);

    // このアイテムの中に含まれるコンテンツの総数
    const contentsNum = useMemo(() => {
        return props.itemIds.reduce((acc, cur) => {
            const descendants = getDescendantContentsIdList(cur, true);
            return acc + descendants.length;
        }, 0);
    }, [props.itemIds, getDescendantContentsIdList]);

    const dispatch = useAppDispatch();
    const [showSelectDialog, setShowSelectDialog] = useState(false);
    const { disabledContentDialog } = useContext(OwnerContext);
    const onClick = useCallback(() => {
        if (props.itemIds.length === 1) {
            dispatch(operationActions.setSelectItem([props.itemIds[0]]));
            // 詳細ダイアログ表示
            if (disabledContentDialog) return;
            doCommand({
                command: 'ShowItemInfo',
                param: props.itemIds[0],
            });
            return;
        }
        // 対象が２つ以上ある場合は、選択ダイアログを表示
        setShowSelectDialog(true);
    }, [dispatch, props.itemIds, disabledContentDialog]);

    const onSelectContentDialogCancel = useCallback(() => {
        setShowSelectDialog(false);
    }, []);

    const mapMode = useSelector((state: RootState) => state.operation.mapMode);

    if (!target) {
        return null;
    }
    if (mapMode === MapMode.Drawing) {
        return null;
    }
    return (
        <>
            <div className={`${styles.Popup} ${imageContentId ? '' : styles.Minimum}`} onClick={onClick}>
                <div className={styles.Contents}>
                    {imageContentId ?
                        <div className={styles.ImageContainer}>
                            <MyThumbnail className={styles.Image} id={imageContentId} alt="contents" />
                        </div>
                        :
                        <div className={styles.ThreeDots}>
                            <BsThreeDots />
                        </div>
                    }
                </div>
                {props.itemIds.length > 1 &&
                    <div className={styles.Number}>{contentsNum}</div>
                }
            </div>
            {showSelectDialog &&
                <SelectContentDialog itemIds={props.itemIds}
                    onCancel={onSelectContentDialogCancel} />
            }
        </>
    );
}