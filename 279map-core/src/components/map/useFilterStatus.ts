import { FeatureLike } from 'ol/Feature';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/configureStore';
import { useFilter } from '../../store/useFilter';

const FORCE_COLOR = '#8888ff';

/**
 * 地物のフィルタ状態を返すフック
 */
export default function useFilterStatus() {
    const filterHook = useFilter();
    const selectedItemIds = useSelector((state: RootState) => state.operation.selectedItemIds);

    /**
     * 指定の地物のフィルタ状態を返す
     */
     const getFilterStatus = useCallback((feature: FeatureLike) => {
        return filterHook?.getFilterStatus(feature.getId() as string);
    }, [filterHook]);

    /**
     * 指定の地物の強調表示色を返す
     * @return 強調表示色。強調しない場合は、undefined。
     */
    const getForceColor = useCallback((feature: FeatureLike): string | undefined => {
        if (selectedItemIds.some(itemId => {
            // TODO: data_source_idの考慮
            return feature.getId() as string === itemId.id;
        })) {
            return FORCE_COLOR;
        }

        const filterStatus = getFilterStatus(feature);
        if (filterStatus.status !== 'Filtered') {
            return;
        }
    
        // カテゴリフィルタにヒットした場合、フィルタしたカテゴリの色で表示する
        return FORCE_COLOR;
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