import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import useData from "../../store/data/useData";

/**
 * ポップアップ開閉フック
 * @returns 
 */
export default function usePopup() {
    const popupTargets = useSelector((state: RootState) => state.operation.popupTargets);

    const { contentsMap } = useData();

    /**
     * ポップアップオープン対象のItemID一覧
     */
    const openedPopupItemIds = useMemo(() => {
        const itemIdSet = new Set<string>();
        popupTargets.forEach(target => {
            if (target.type === 'item') {
                itemIdSet.add(target.itemId);
            } else {
                const content = contentsMap.get(target.contentId);
                if (content?.itemId) {
                    itemIdSet.add(content.itemId);
                }
            }
        });
        return Array.from(itemIdSet);
    }, [popupTargets, contentsMap]);

    return {
        openedPopupItemIds,
    }


}