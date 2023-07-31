import { FeatureLike } from 'ol/Feature';
import { useCallback } from 'react';
import { useFilter } from '../../store/filter/useFilter';
import { convertDataIdFromFeatureId, isEqualId } from '../../util/dataUtility';
import { useRecoilValue } from 'recoil';
import { selectedItemIdsState } from '../../store/operation';

const FORCE_COLOR = '#8888ff';

/**
 * 地物のフィルタ状態を返すフック
 */
export default function useFilterStatus() {
    const { getFilterStatusOfTheItem } = useFilter();
    const selectedItemIds = useRecoilValue(selectedItemIdsState);

    /**
     * 指定の地物のフィルタ状態を返す
     */
     const getFilterStatus = useCallback((feature: FeatureLike) => {
        const itemId = convertDataIdFromFeatureId(feature.getId() as string);
        return getFilterStatusOfTheItem(itemId);
    }, [getFilterStatusOfTheItem]);

    /**
     * 指定の地物の強調表示色を返す
     * @return 強調表示色。強調しない場合は、undefined。
     */
    const getForceColor = useCallback((feature: FeatureLike): string | undefined => {
        // 選択されているものは強調表示
        if (selectedItemIds.some(itemId => {
            const id = convertDataIdFromFeatureId(feature.getId() as string);
            return isEqualId(id, itemId);
        })) {
            return FORCE_COLOR;
        }

        const filterStatus = getFilterStatus(feature);
        if (filterStatus !== 'Filtered') {
            return;
        }
    
        // カテゴリフィルタにヒットした場合、フィルタしたカテゴリの色で表示する
        // →カテゴリ対象外のものを半透明or非表示にすることにしたので、特に強調色はつけないように変更 2023/6/19

        // if (filterStatus.filter.type === 'category') {
        //     const categoryDef = categoryMap.get(filterStatus.filter.categoryName);
        //     return categoryDef?.color;
        // } else {
        //     // その他のフィルタに非っとした場合は、強調表示
        //     return FORCE_COLOR;
        // }

    }, [getFilterStatus, selectedItemIds]);

    return {
        getFilterStatus,
        getForceColor,
    }
}