import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import styles from './PointsPopup.module.scss';
import { useFilter } from "../../store/useFilter";
import ItemContents from "./ItemContents";
import { ContentsDefine, ItemContentInfo, ItemDefine } from "279map-common";

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
    const targets = useMemo(() => {
        if (props.itemIds.length === 0) {
            return [];
        }
        let infos = props.itemIds.map(id => itemMap[id]);
        // フィルタがかかっている場合は、フィルタ対象のものに絞る
        if (isFiltered) {
            infos = infos.filter(info => filteredItemIdList?.includes(info.id));
        }
        if (infos.length === 1) {
            return infos;
        }
        // 複数アイテムが表示対象の場合は、画像を持つもののみ表示対象
        const ownImageInfos = infos.filter(info => hasImageItem(info));
        return ownImageInfos;
    }, [props.itemIds, itemMap, filteredItemIdList, isFiltered]);

    const hasImage = useMemo(() => {
        return targets.some(item => hasImageItem(item));
    }, [targets]);

    return (
        <div className={`${styles.Popup} ${hasImage ? '' : styles.Minimum}`}>
            <div className={styles.Contents}>
                {
                    targets.map(target => {
                        return (
                            <ItemContents key={target.id} item={target} />
                        );
                    })
                }
            </div>
        </div>
    );
}