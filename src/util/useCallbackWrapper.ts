import { useCallback, useEffect, useRef } from "react";

/**
 * useEffect内で呼び出すcallbackをラッパーすることで、
 * useEffect無限ループを防ぐ目的のもの。
 * 
 * useEffect内でstateの値にアクセスするcallbackを使用すると
 * 無限ループが発生する。
 * useEffectの第2引数にuseCallbackを含めなければ問題ないが、
 * そうするとeslint警告が発生し、この警告を無効にすると、
 * 依存関係に含めるべきものも見落としてしまう可能性があるので、
 * このラッパーhookを使用して、callbackの変更検知をラップする。
 * @param callback 
 * @returns 
 */
export function useCallbackWrapper(callback?: Function) {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const call = useCallback((...args: any) => {
        if (!callbackRef.current) return;
        callbackRef.current.apply(undefined, args);
    }, []);

    return {
        call,
    }
}