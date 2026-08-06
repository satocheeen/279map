import { useEffect, DependencyList } from 'react';

/**
 * 指定した値が変更した際のフック。
 * useEffectは用途が多いので、明示的にフックを用意することで、
 * 使用目的を明確にしている。
 */
export function useWatch(process: () => void, deps: DependencyList) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(process, deps);
}
