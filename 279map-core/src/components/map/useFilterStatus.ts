import { FeatureLike } from 'ol/Feature';
import { useCallback, useContext } from 'react';
import { useFilter } from '../../store/filter/useFilter';
import { convertDataIdFromFeatureId, isEqualId } from '../../util/dataUtility';
import { selectItemIdAtom } from '../../store/operation';
import { useAtom } from 'jotai';
import { itemProcessesAtom } from '../../store/item';
import { OwnerContext } from '../TsunaguMap/TsunaguMap';
import { FeatureType, GeoProperties } from '../../types-common/common-types';
import { FeatureColor } from './types';

export enum Opacity {
    Normal = 'Normal',         // 通常
    Transparent = 'Transparent',    // 半透明
    Hidden = 'Hidden'          // 非表示
}
/**
 * 地物のフィルタ状態を返すフック
 */
export default function useFilterStatus() {
    const { getFilterStatusOfTheItem } = useFilter();
    const [ selectedItemId ] = useAtom(selectItemIdAtom);
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
    const getForceColor = useCallback((feature: FeatureLike): FeatureColor | undefined => {
        const id = convertDataIdFromFeatureId(feature.getId() as string);

        // エラー状態のものはエラー色表示
        if (itemProcesses.find(process => {
            if (process.status === 'registing') {
                return isEqualId(process.item.id, id)
            } else if (process.status === 'updating') {
                return process.items.some(item => isEqualId(item.id, id));
            } else if (process.status === 'deleting') {
                return isEqualId(process.itemId, id)
            } else {
                return false;
            }
        })?.error) {
            return FeatureColor.Error;
        }

        // 選択されているものは強調表示
        if (selectedItemId && isEqualId(selectedItemId, id)) {
            return FeatureColor.Selected;
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
    const getOpacity = useCallback((feature: FeatureLike): Opacity => {
        const id = convertDataIdFromFeatureId(feature.getId() as string);
        if (itemProcesses.some(process => {
            if (process.status === 'registing') {
                return isEqualId(process.item.id, id)
            } else if (process.status === 'deleting') {
                return isEqualId(process.itemId, id)
            }            
        })) {
            // 新規登録中アイテム or 削除処理中アイテム（エラー時）
            return Opacity.Transparent;
        }

        // フィルタ時、フィルタ対象外はopacity設定
        const featureType = (feature.getProperties() as GeoProperties).featureType;
        if (![FeatureType.STRUCTURE, FeatureType.TRACK].includes(featureType)) {
            // 土地などは透過しない
            return Opacity.Normal;
        }
        const filterStatus = getFilterStatus(feature);
        if (filterStatus === 'UnFiltered') {
            if (filterUnmatchView === 'hidden') {
                return Opacity.Hidden;
            } else {
                return Opacity.Transparent;
            }
        }
        return Opacity.Normal;

    }, [filterUnmatchView, getFilterStatus, itemProcesses]);

    return {
        getFilterStatus,
        getForceColor,
        getOpacity,
    }
}