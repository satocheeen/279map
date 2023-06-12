import { useMounted } from "../../../util/useMounted";
import { useProcessMessage } from "./useProcessMessage";

/**
 * lazyコンポーネントの読み込み中にOverlay表示するためのコンポーネント。
 * Suspenseのfallbackに設定する。
 * @returns 
 */
export default function LoadingOverlay() {
    const { showProcessMessage, hideProcessMessage } = useProcessMessage();

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