import { useEffect, useRef } from "react";

/**
 * 指定のリアクティブな値の変更を検知して、変更時にコールバックするカスタムフック
 * @param reactiveVal 変更検知する値
 * @param callback 変更時コールバック
 */
export function useWatch<T>(reactiveVal: T, callback: (oldVal: T, newVal: T) => void) {
    const prevVal = useRef(structuredClone(reactiveVal));

    useEffect(() => {
        const isChange = function() {
            if (typeof reactiveVal === 'object') {
                return JSON.stringify(reactiveVal) !== JSON.stringify(prevVal.current);
            } else {
                return reactiveVal !== prevVal.current;
            }
        }();
    
        if (isChange) {
            const newVal = structuredClone(reactiveVal)
            callback(prevVal.current, newVal);
            prevVal.current = newVal;
        }
    }, [reactiveVal, callback])
}
