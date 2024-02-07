import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { TemporaryItem, temporaryItemsAtom } from ".";
import { ItemInfo } from "../../types/types";
import { clientAtom } from "jotai-urql";
import { RegistItemDocument, UpdateItemInput } from "../../graphql/generated/graphql";

/**
 * 登録・更新・削除処理を担うカスタムフック
 */
let temporaryCount = 0;

type RegistItemParam = {
    datasourceId: string;
    geoJson: ItemInfo['geoJson'];
    geoProperties: ItemInfo['geoProperties'];
}

export default function useItemProcess() {
    /**
     * 一時アイテムを追加する
     */
    const addTemporaryItem = useAtomCallback(
        useCallback((get, set, temporaryItem: TemporaryItem) => {
            set(temporaryItemsAtom, (cur) => {
                return cur.concat(temporaryItem);
            })
        }, [])
    )

    /**
     * 一時アイテムを削除する
     */
    const removeTemporaryItem = useAtomCallback(
        useCallback((get, set, processId: string) => {
            set(temporaryItemsAtom, (cur) => {
                return cur.filter(cur => cur.processId !== processId);
            })
        }, [])
    )

    /**
     * 指定のプロセスについてエラーフラグを更新する
     */
    const setErrorWithTemporaryItem = useAtomCallback(
        useCallback((get, set, processId: string, errorFlag: boolean) => {
            set(temporaryItemsAtom, (cur) => {
                return cur.map(item => {
                    if (item.processId === processId) {
                        const newObj = structuredClone(item);
                        newObj.error = errorFlag;
                        return newObj;
                    } else {
                        return item;
                    }
                });
            })
        }, [])
    )

    /**
     * アイテム登録処理
     */
    const registItem = useAtomCallback(
        useCallback(async(get, set, item: RegistItemParam) => {
            // ID付与
            const processId = `process-${++temporaryCount}`;

            // 登録完了までの仮アイテム登録
            addTemporaryItem({
                processId,
                item: {
                    id: {
                        id: processId,
                        dataSourceId: item.datasourceId,
                    },
                    geoJson: item.geoJson,
                    geoProperties: item.geoProperties,
                },
                status: 'registing',
            });

            const gqlClient = get(clientAtom);
            let retryFlag = false;
            do {
                retryFlag = false;
                const result = await gqlClient.mutation(RegistItemDocument, {
                    datasourceId: item.datasourceId,
                    geometry: item.geoJson,
                    geoProperties: item.geoProperties,
                });
                if (result.error) {
                    // エラー時
                    console.warn('registItem failed', result.error.message);
                    setErrorWithTemporaryItem(processId, true);
                    // キャンセル or リトライ の指示待ち
                    retryFlag = await waitFor(processId);
                    setErrorWithTemporaryItem(processId, false);
                }
        
            } while(retryFlag);

            // 仮アイテム削除
            removeTemporaryItem(processId);

        }, [addTemporaryItem, removeTemporaryItem, setErrorWithTemporaryItem])
    )

    const updateItem = useAtomCallback(
        useCallback((get, set, param: UpdateItemInput[]) => {

        }, [])
    )

    /**
     * 指定のリトライ待ち処理についてリトライorキャンセルを指定する
     * @param retry リトライの場合、true。キャンセルの場合、false。
     */
    const continueProcess = useAtomCallback(
        useCallback(async(get, set, processId: string, retry: boolean) => {
            if (!resolveMap[processId]) {
                console.warn('not exist the process', processId);
                return;
            }
            resolveMap[processId](retry);
        }, [])
    )

    return {
        registItem,
        continueProcess,
    }
}

// リトライの場合、true。キャンセルの場合、false。
const resolveMap = {} as {[processId: string]: (value: boolean) => void};
async function waitFor(processId: string) {
    return new Promise<boolean>((resolve) => {
        resolveMap[processId] = resolve;
    })
}
