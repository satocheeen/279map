import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { ItemProcessType, itemProcessesAtom } from ".";
import { ItemInfo, TsunaguMapHandler } from "../../types/types";
import { clientAtom } from "jotai-urql";
import { RegistDataDocument, RemoveDataDocument, UpdateDataDocument } from "../../graphql/generated/graphql";
import { DataId } from "../../entry";
import { isEqualId } from "../../util/dataUtility";

/**
 * 登録・更新・削除処理を担うカスタムフック
 */
let temporaryCount = 0;

export type UpdateItemParam = {
    id: DataId;
    geometry: ItemInfo['geometry'];
    geoProperties: ItemInfo['geoProperties'];
}

type RegistDataParam = Parameters<TsunaguMapHandler['registData']>[0];

export default function useItemProcess() {
    /**
     * プロセス追加
     */
    const _addDataProcess = useAtomCallback(
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
        useCallback((get, set, processId: DataId) => {
            set(itemProcessesAtom, (cur) => {
                return cur.filter(cur => cur.processId !== processId);
            })
        }, [])
    )

    /**
     * 指定のプロセスの指定の仮アイテムを削除する
     */
    const _removeTemporaryItems = useAtomCallback(
        useCallback((get, set, processId: DataId, targets: DataId[]) => {
            set(itemProcessesAtom, (cur) => {
                return cur.map(cur => {
                    if (cur.processId !== processId) return cur;
                    if (cur.status !== 'updating') return cur;

                    const newItems = cur.datas.filter(item => !targets.some(target => isEqualId(target, item.id)));
                    return Object.assign({}, cur, { items: newItems });
                });
            })

        }, [])
    )

    /**
     * 指定のプロセスについてエラーフラグを更新する
     */
    const _setErrorWithTemporaryItem = useAtomCallback(
        useCallback((get, set, processId: DataId, errorFlag: boolean) => {
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

    const _registDataSub = useAtomCallback(
        useCallback(async(get, set, data: RegistDataParam, processId: DataId): Promise<DataId> => {
            const gqlClient = get(clientAtom);
            let retryFlag = false;
            let dataId: DataId | undefined;
            do {
                retryFlag = false;
                const result = await gqlClient.mutation(RegistDataDocument, {
                    datasourceId: data.datasourceId,
                    item: data.item?.geo,
                    contents: data.contents,
                    linkDatas: data.parent ? [data.parent] : undefined,
                })
                if (result.error) {
                    // エラー時
                    console.warn('registItem failed', result.error.message);
                    _setErrorWithTemporaryItem(processId, true);
                    // キャンセル or リトライ の指示待ち
                    retryFlag = await waitFor(processId);
                    _setErrorWithTemporaryItem(processId, false);
                } else {
                    dataId = result.data?.registData ?? undefined;
                }
        
            } while(retryFlag);

            // 仮アイテム削除（WebSocket経由で新規アイテムを取得するまでのタイムラグがあるので間をおいて実行）
            setTimeout(() => {
                _removeItemProcess(processId);
            }, 500)

            if (!dataId) {
                throw new Error('regist failed')
            }

            return dataId;

        }, [_setErrorWithTemporaryItem, _removeItemProcess])
    )

    /**
     * データ登録処理
     */
    const registData = useAtomCallback(
        useCallback(async(get, set, data: RegistDataParam) => {
            // ID付与
            const processId = ++temporaryCount;

            if (data.item) {
                // 登録完了までの仮アイテム登録
                _addDataProcess({
                    processId,
                    data: {
                        id: processId,
                        item: {
                            geometry: data.item.geo.geometry,
                            geoProperties: data.item.geo.geoProperties,
                        },
                        contents: data.contents,
                        parent: data.parent,
                    },
                    datasourceId: data.datasourceId,
                    status: 'registing',
                });

            }

            return await _registDataSub(data, processId);

        }, [_addDataProcess, _registDataSub])
    )

    const updateItems = useAtomCallback(
        useCallback(async(get, set, items: UpdateItemParam[]) => {
            // ID付与
            const processId = ++temporaryCount;

            // 登録完了までの仮アイテム登録
            _addDataProcess({
                processId,
                datas: items.map(item=> {
                    return {
                        id: item.id,
                        item: {
                            geometry: item.geometry,
                            geoProperties: item.geoProperties,
                        }
                    }
                }),
                status: 'updating',
            });

            const gqlClient = get(clientAtom);
            let retryFlag = false;
            do {
                retryFlag = false;
                const allResult = await Promise.all(items.map(async(item) => {
                    const result = await gqlClient.mutation(UpdateDataDocument, {
                        id: item.id,
                        item: {
                            geometry: item.geometry,
                            geoProperties: item.geoProperties,
                        }
                    });
                    return {
                        result,
                        id: item.id,
                    }
                }));
                const successResult = allResult.filter(ar => ar.result.data);
                const errorResult = allResult.filter(ar => ar.result.error);
                if (errorResult.length > 0) {
                    // エラー時
                    if (successResult.length > 0) {
                        // 一部エラー時は、成功したアイテムは仮アイテムから削除する
                        _removeTemporaryItems(processId, successResult.map(sr => sr.id));
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


        }, [_addDataProcess, _removeItemProcess, _setErrorWithTemporaryItem, _removeTemporaryItems])
    )

    const removeData = useAtomCallback(
        useCallback(async(get, set, target: DataId) => {
            // ID付与
            const processId = ++temporaryCount;

            // 登録完了までの仮アイテム登録
            _addDataProcess({
                processId,
                status: 'deleting',
                itemId: target,
            });

            const gqlClient = get(clientAtom);
            let retryFlag = false;
            do {
                retryFlag = false;
                const result = await gqlClient.mutation(RemoveDataDocument, {
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

        }, [_addDataProcess, _removeItemProcess, _setErrorWithTemporaryItem])
    )

    /**
     * 指定のリトライ待ち処理についてリトライorキャンセルを指定する
     * @param retry リトライの場合、true。キャンセルの場合、false。
     */
    const continueProcess = useAtomCallback(
        useCallback(async(get, set, processId: DataId, retry: boolean) => {
            if (!resolveMap[processId]) {
                console.warn('not exist the process', processId);
                return;
            }
            resolveMap[processId](retry);
        }, [])
    )

    return {
        registData,
        updateItems,
        removeData,
        continueProcess,
    }
}

// リトライの場合、true。キャンセルの場合、false。
const resolveMap = {} as {[processId: DataId]: (value: boolean) => void};
async function waitFor(processId: DataId) {
    return new Promise<boolean>((resolve) => {
        resolveMap[processId] = resolve;
    })
}
