import React, { useRef, useContext } from 'react';
import { useWatch } from '../../util/useWatch';
import { useRecoilValue } from 'recoil';
import { OwnerContext } from './TsunaguMap';
import { categoryState } from '../../store/category';

type Props = {
}

/**
 * 各値の変更検知して呼び出し元に返すコンポーネントもどき
 * @param props 
 * @returns 
 */
export default function ValueListener() {
    const ownerContext = useContext(OwnerContext);
    const onCategoriesLoadedRef = useRef<typeof ownerContext.onCategoriesLoaded>();

    useWatch(() => {
        onCategoriesLoadedRef.current = ownerContext.onCategoriesLoaded;
    }, [ownerContext]);

    /**
     * callback when categories has loaded or changed.
     */
    const categories = useRecoilValue(categoryState);
    useWatch(() => {
        console.log('category changed', categories);
        if (onCategoriesLoadedRef.current) {
            onCategoriesLoadedRef.current(categories);
        }
    }, [categories]);

    return null;
}