import { useMounted } from "../../../util/useMounted";
import { useOverlay } from "./useOverlay";

/**
 * lazyコンポーネントの読み込み中にOverlay表示するためのコンポーネント。
 * Suspenseのfallbackに設定する。
 * @returns 
 */
export default function LoadingOverlay() {
    const { showProcessMessage, hideProcessMessage } = useOverlay();

    useMounted(() => {
        showProcessMessage({
            overlay: true,
            spinner: true,
            message: '準備中...',
        });

        return () => {
            hideProcessMessage();
        }
    });

    return null;
}