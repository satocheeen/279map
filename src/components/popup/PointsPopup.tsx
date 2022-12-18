import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../store/configureStore";
import styles from './PointsPopup.module.scss';
import { BsThreeDots } from 'react-icons/bs';
import { useFilter } from "../../store/useFilter";
import ItemContents from "./ItemContents";
import { openItemPopup } from "./popupThunk";
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
    const itemMap = useSelector((state: RootState) => state.data.itemMap);

    const targets = useMemo(() => {
        return props.itemIds.map(id => itemMap[id]);
    }, [props.itemIds, itemMap]);
    const { isFiltered } = useFilter();
    const status = useMemo((): 'Open' | 'Close' | 'Hide' => {
        return 'Open';
        // if (targetContentsList.length > 0) {
        //     return 'Open';
        // }
        // // フィルタOn状態で、当該アイテムに表示対象コンテンツのない場合は、非表示にする
        // if (isFiltered) {
        //     return 'Hide';
        // }
        // return 'Close';

    }, [isFiltered]);

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
                            targets.map(target => {
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
    }, [status, targets]);

    return (
        <div className={`${styles.Popup} ${styles[status]}`} onClick={onOpen}>
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