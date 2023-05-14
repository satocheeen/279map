import { useEffect, DependencyList } from 'react';

/**
 * コンポーネントマウント時のフック
 */
export function useWatch(process: () => void, deps: DependencyList) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(process, deps);
}
