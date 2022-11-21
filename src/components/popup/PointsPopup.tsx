import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import styles from './PointsPopup.module.scss';
import { BsThreeDots } from 'react-icons/bs';
import { useFilter } from "../../store/useFilter";
import ItemContents from "./ItemContents";
import { openItemPopup } from "./popupThunk";
import useData from "../../store/data/useData";
import { ContentsDefine } from "279map-common";

type Props = {
    // このポップアップにて情報表示する対象アイテム
    itemIds: string[];
}

export type PopupItem = {
    id: string;
    content?: ContentsDefine;
}

export default function PointsPopup(props: Props) {
    const popupTargets = useSelector((state: RootState) => state.operation.popupTargets);
    const { contentsMap, itemContentsMap } = useData();

    /**
     * popupTargets内のうち、自身に関係するもの
     */
    const myTargets = useMemo(() => {
        return popupTargets.filter(target => {
            if (target.type === 'item') {
                return props.itemIds.includes(target.itemId);
            } else {
                const content = contentsMap.get(target.contentId);
                if (!content) {
                    return false;
                }
                return props.itemIds.includes(content.itemId);
            }
        });
    }, [popupTargets, contentsMap, props.itemIds]);

    /**
     * 表示対象のコンテンツ情報一覧
     */
    const targetContentsList = useMemo((): PopupItem[] => {
        const map = {} as {[itemId: string]: PopupItem};
        myTargets.forEach(target => {
            if (target.type === 'item') {
                const content = itemContentsMap.get(target.itemId);
                if (content || target.force) {
                    if (!map[target.itemId]) {
                        map[target.itemId] = {
                            id: target.itemId,
                        };
                    }
                    if (content) {
                        map[target.itemId].content = content;
                    }
                }
            } else {
                const content = contentsMap.get(target.contentId);
                if (content) {
                    if (!map[content.itemId]) {
                        map[content.itemId] = {
                            id: content.itemId,
                            // name: itemMap[content.itemId].name,
                            // overview: itemMap[content.itemId].overview,
                            // contents: [],
                        };
                    }
                    map[content.itemId].content = content;
                }
            }
        })
        return Object.values(map);
    }, [contentsMap, itemContentsMap, myTargets]);

    const { isFiltered } = useFilter();
    const status = useMemo((): 'Open' | 'Close' | 'Hide' => {
        if (targetContentsList.length > 0) {
            return 'Open';
        }
        // フィルタOn状態で、当該アイテムに表示対象コンテンツのない場合は、非表示にする
        if (isFiltered) {
            return 'Hide';
        }
        return 'Close';

    }, [targetContentsList, isFiltered]);

    const dispatch = useAppDispatch();
    const onOpen = useCallback(async() => {
        if (status === 'Close'){
            // 閉じた状態でクリックされた場合は、アイテムが持つすべてのコンテンツを表示する
            await dispatch(openItemPopup({ itemIds: props.itemIds }));
        }
    }, [props.itemIds, dispatch, status]);

    const dom = useMemo(() => {
        switch(status) {
            case 'Open':
                return (
                    <div className={styles.Contents}>
                        {
                            targetContentsList.map(target => {
                                return (
                                    <ItemContents key={target.id} item={target} />
                                );
                            })
                        }
                    </div>
                );
            case 'Close':
                return (
                    <BsThreeDots />
                );
            case 'Hide':
                return null;
        }
    }, [status, targetContentsList]);

    return (
        <div className={`${styles.Popup} ${styles[status]}`} onClick={onOpen}>
            {dom}
        </div>
    );
}