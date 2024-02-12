import { FeatureLike } from 'ol/Feature';
import { useCallback, useContext } from 'react';
import { useFilter } from '../../store/filter/useFilter';
import { convertDataIdFromFeatureId, isEqualId } from '../../util/dataUtility';
import { showingDetailItemIdAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { itemProcessesAtom } from '../../store/item';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { FeatureType, GeoProperties } from '../../entry';

const ERROR_COLOR = '#ff8888';
const FORCE_COLOR = '#8888ff';

/**
 * 地物のフィルタ状態を返すフック
 */
export default function useFilterStatus() {
    const { getFilterStatusOfTheItem } = useFilter();
    const [ selectedItemId ] = useAtom(showingDetailItemIdAtom);
    const [ itemProcesses ] = useAtom(itemProcessesAtom);

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
        const id = convertDataIdFromFeatureId(feature.getId() as string);

        // エラー状態のものはエラー色表示
        if (itemProcesses.find(process => {
            if (process.status === 'registing') {
                return isEqualId(process.item.id, id)
            } else if (process.status === 'updating') {
                return process.items.some(item => isEqualId(item.id, id));
            } else {
                return isEqualId(process.itemId, id)
            }
        })?.error) {
            return ERROR_COLOR;
        }

        // 選択されているものは強調表示
        if (selectedItemId && isEqualId(selectedItemId, id)) {
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

    }, [getFilterStatus, selectedItemId, itemProcesses]);

    const { filterUnmatchView } = useContext(OwnerContext);
    const getOpacity = useCallback((feature: FeatureLike): number => {
        const id = convertDataIdFromFeatureId(feature.getId() as string);
        if (itemProcesses.some(process => {
            if (process.status === 'registing') {
                return isEqualId(process.item.id, id)
            } else if (process.status === 'deleting') {
                return isEqualId(process.itemId, id)
            }            
        })) {
            // 新規登録中アイテム or 削除処理中アイテム（エラー時）
            return 0.3;
        }

        // フィルタ時、フィルタ対象外はopacity設定
        const featureType = (feature.getProperties() as GeoProperties).featureType;
        if (![FeatureType.STRUCTURE, FeatureType.TRACK].includes(featureType)) {
            // 土地などは透過しない
            return 1;
        }
        const filterStatus = getFilterStatus(feature);
        if (filterStatus === 'UnFiltered') {
            if (filterUnmatchView === 'hidden') {
                return 0;
            } else {
                return 0.3;
            }
        }
        return 1;

    }, [filterUnmatchView, getFilterStatus, itemProcesses]);

    return {
        getFilterStatus,
        getForceColor,
        getOpacity,
    }
}