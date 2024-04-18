import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { ItemProcessType, itemProcessesAtom } from ".";
import { ItemInfo } from "../../types/types";
import { clientAtom } from "jotai-urql";
import { RegistItemDocument, UpdateItemsDocument, UpdateItemInput, RemoveItemDocument } from "../../graphql/generated/graphql";
import { DataId } from "../../entry";
import { isEqualId } from "../../util/dataUtility";

/**
 * 登録・更新・削除処理を担うカスタムフック
 */
let temporaryCount = 0;

type RegistItemParam = {
    datasourceId: string;
    geometry: ItemInfo['geometry'];
    geoProperties: ItemInfo['geoProperties'];
}

export default function useItemProcess() {
    /**
     * プロセス追加
     */
    const _addItemProcess = useAtomCallback(
        useCallback((get, set, temporaryItem: ItemProcessType) => {
            set(itemProcessesAtom, (cur) => {
                return cur.concat(temporaryItem);
            })
        }, [])
    )

    /**
     * プロセス削除
     */
    const _removeItemProcess = useAtomCallback(
        useCallback((get, set, processId: string) => {
            set(itemProcessesAtom, (cur) => {
                return cur.filter(cur => cur.processId !== processId);
            })
        }, [])
    )

    /**
     * 指定のプロセスの指定の仮アイテムを削除する
     */
    const _removeTemporaryItems = useAtomCallback(
        useCallback((get, set, processId: string, targets: DataId[]) => {
            set(itemProcessesAtom, (cur) => {
                return cur.map(cur => {
                    if (cur.processId !== processId) return cur;
                    if (cur.status !== 'updating') return cur;
                    const newItems = cur.items.filter(item => !targets.some(target => isEqualId(target, item.id)));
                    return Object.assign({}, cur, { items: newItems });
                });
            })

        }, [])
    )

    /**
     * 指定のプロセスについてエラーフラグを更新する
     */
    const _setErrorWithTemporaryItem = useAtomCallback(
        useCallback((get, set, processId: string, errorFlag: boolean) => {
            set(itemProcessesAtom, (cur) => {
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
            _addItemProcess({
                processId,
                item: {
                    id: {
                        id: processId,
                        dataSourceId: item.datasourceId,
                    },
                    geometry: item.geometry,
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
                    geometry: item.geometry,
                    geoProperties: item.geoProperties,
                });
                if (result.error) {
                    // エラー時
                    console.warn('registItem failed', result.error.message);
                    _setErrorWithTemporaryItem(processId, true);
                    // キャンセル or リトライ の指示待ち
                    retryFlag = await waitFor(processId);
                    _setErrorWithTemporaryItem(processId, false);
                }
        
            } while(retryFlag);

            // 仮アイテム削除（WebSocket経由で新規アイテムを取得するまでのタイムラグがあるので間をおいて実行）
            setTimeout(() => {
                _removeItemProcess(processId);
            }, 500)

        }, [_addItemProcess, _removeItemProcess, _setErrorWithTemporaryItem])
    )

    /**
     * 一時描画状態で登録する。明示的に登録指示するまで、DBには登録されない
     * @return 仮ID
     */
    const registTemporaryItem = useCallback((item: RegistItemParam) => {
        // 仮ID付与
        const processId = `process-${++temporaryCount}`;

        // 仮アイテム登録
        _addItemProcess({
            processId,
            item: {
                id: {
                    id: processId,
                    dataSourceId: item.datasourceId,
                },
                geometry: item.geometry,
                geoProperties: item.geoProperties,
            },
            status: 'temporary',
        });

        return processId;

    }, [_addItemProcess])

    const updateItems = useAtomCallback(
        useCallback(async(get, set, items: UpdateItemInput[]) => {
            // ID付与
            const processId = `process-${++temporaryCount}`;

            // 登録完了までの仮アイテム登録
            _addItemProcess({
                processId,
                items,
                status: 'updating',
            });

            const gqlClient = get(clientAtom);
            let retryFlag = false;
            do {
                retryFlag = false;
                const result = await gqlClient.mutation(UpdateItemsDocument, {
                    targets: items,
                });
                if (result.error || result.data?.updateItems.error) {
                    // エラー時
                    if (result.data?.updateItems.error) {
                        // 一部エラー時は、成功したアイテムは仮アイテムから削除する
                        _removeTemporaryItems(processId, result.data.updateItems.success);
                    }
                    _setErrorWithTemporaryItem(processId, true);
                    // キャンセル or リトライ の指示待ち
                    retryFlag = await waitFor(processId);
                    _setErrorWithTemporaryItem(processId, false);
                }
        
            } while(retryFlag);

            // 仮アイテム削除（WebSocket経由で更新後アイテムを取得するまでのタイムラグがあるので間をおいて実行）
            setTimeout(() => {
                _removeItemProcess(processId);
            }, 500)


        }, [_addItemProcess, _removeItemProcess, _setErrorWithTemporaryItem, _removeTemporaryItems])
    )

    const removeItem = useAtomCallback(
        useCallback(async(get, set, target: DataId) => {
            // ID付与
            const processId = `process-${++temporaryCount}`;

            // 登録完了までの仮アイテム登録
            _addItemProcess({
                processId,
                status: 'deleting',
                itemId: target,
            });

            const gqlClient = get(clientAtom);
            let retryFlag = false;
            do {
                retryFlag = false;
                const result = await gqlClient.mutation(RemoveItemDocument, {
                    id: target,
                });
                if (result.error) {
                    // エラー時
                    _setErrorWithTemporaryItem(processId, true);
                    // キャンセル or リトライ の指示待ち
                    retryFlag = await waitFor(processId);
                    _setErrorWithTemporaryItem(processId, false);
                }
        
            } while(retryFlag);

            // 仮アイテム削除（WebSocket経由で削除情報を取得するまでのタイムラグがあるので間をおいて実行）
            setTimeout(() => {
                _removeItemProcess(processId);
            }, 500)

        }, [_addItemProcess, _removeItemProcess, _setErrorWithTemporaryItem])
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
        updateItems,
        removeItem,
        registTemporaryItem,
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
