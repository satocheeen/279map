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
        showSpinner('準備中...');

        return () => {
            hideSpinner();
        }
    });

    return null;
}