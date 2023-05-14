import { useEffect } from 'react';

/**
 * コンポーネントマウント時のフック
 */
export function useMounted(process: () => void) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(process, []);
}
