import { useMounted } from "../../../util/useMounted";
import { useOverlay } from "./useOverlay";

/**
 * lazyコンポーネントの読み込み中にOverlay表示するためのコンポーネント。
 * Suspenseのfallbackに設定する。
 * @returns 
 */
export default function LoadingOverlay() {
    const { showSpinner, hideSpinner } = useOverlay();

    useMounted(() => {
        console.log('component load start');
        showSpinner('準備中...');

        return () => {
            console.log('component load end');
            hideSpinner();
        }
    });

    return null;
}