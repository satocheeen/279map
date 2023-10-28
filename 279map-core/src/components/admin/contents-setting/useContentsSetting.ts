import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import { showModalAtom } from './atom';
import { authLvAtom } from '../../../store/session';
import { Auth } from '279map-common';

/**
 * コンテンツ設定画面を突き放し実行で表示するためのカスタムフック
 */
export default function useContentsSetting() {
    const showContentsSetting = useAtomCallback(
        useCallback((get, set) => {
            const authLv = get(authLvAtom);
            if (authLv !== Auth.Admin) {
                console.warn('no authorization', authLv);
                return;
            }
            // Modalを表示
            set(showModalAtom, true);
        }, [])
    );

    return {
        showContentsSetting,
    }
}