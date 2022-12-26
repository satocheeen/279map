import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import styles from './PointsPopup.module.scss';
import { useFilter } from "../../store/useFilter";
import ItemContents from "./ItemContents";
import { ContentsDefine, ItemContentInfo, ItemDefine } from "279map-common";
import { operationActions } from "../../store/operation/operationSlice";
import SelectContentDialog from "./select-content/SelectContentDialog";

type Props = {
    // このポップアップにて情報表示する対象アイテム
    itemIds: string[];
}

export type PopupItem = {
    id: string;
    content?: ContentsDefine;
}

function hasImageItem(item: ItemDefine): boolean {
    if (!item.contents) return false;
    if (item.contents.hasImage) return true;
    const hasChildOwnImage = (children: ItemContentInfo[]): boolean => {
        return children.some(child => {
            if (child.hasImage) return true;
            return hasChildOwnImage(child.children);
        });
    }
    return hasChildOwnImage(item.contents.children);

}
export default function PointsPopup(props: Props) {
    const itemMap = useSelector((state: RootState) => state.data.itemMap);
    const { isFiltered, filteredItemIdList } = useFilter();

    /**
     * このポップアップで表示するアイテム情報
     */
    const target = useMemo(() => {
        if (props.itemIds.length === 0) {
            return undefined;
        }
        let infos = props.itemIds.map(id => itemMap[id]);
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

    const hasImage = useMemo(() => {
        if (!target) return false;
        return hasImageItem(target);
    }, [target]);

    const dispatch = useAppDispatch();
    const [showSelectDialog, setShowSelectDialog] = useState(false);
    const onClick = useCallback(() => {
        if (props.itemIds.length === 1) {
            dispatch(operationActions.setSelectItem([props.itemIds[0]]));
            return;
        }
        // 対象が２つ以上ある場合は、選択ダイアログを表示
        setShowSelectDialog(true);
    }, [dispatch, props.itemIds]);

    const onSelectContentDialogCancel = useCallback(() => {
        setShowSelectDialog(false);
    }, []);

    if (!target) {
        return null;
    }
    return (
        <>
            <div className={`${styles.Popup} ${hasImage ? '' : styles.Minimum}`} onClick={onClick}>
                <div className={styles.Contents}>
                    <ItemContents key={target.id} item={target} />
                </div>
                {props.itemIds.length > 1 &&
                    <div className={styles.Number}>{props.itemIds.length}</div>
                }
            </div>
            {showSelectDialog &&
                <SelectContentDialog itemIds={props.itemIds}
                    onCancel={onSelectContentDialogCancel} />
            }
        </>
    );
}