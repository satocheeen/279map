import { useMemo } from 'react';
import { useAtom } from "jotai";
import { allItemsAtom } from ".";
import { DataId } from '../../types-common/common-types';

type Props = {
    id: DataId;
}

/**
 * 指定のidに対応するアイテム情報を返すフック。
 * アイテム情報変更に対してリアクティブに挙動する。
 * @param props 
 * @returns 
 */
export function useItem(props: Props) {
    const [ allItems ] = useAtom(allItemsAtom);

    const item = useMemo(() => {
        return allItems.find(item => item.id === props.id);

    }, [ allItems, props.id ])

    return {
        item,
    }
}