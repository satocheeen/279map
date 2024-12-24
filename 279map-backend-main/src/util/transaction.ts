/**
 * トランザクションテーブル関連の処理群
 */

import { ConnectionPool } from "..";
import { CurrentMap, TransactionQueueTable } from "../../279map-backend-common/src";
import { QueryGetImageArgs } from "../graphql/__generated__/types";
import { ItemDefineWithoutContents } from "../types";

/**
 * トランザクションTBLに登録する
 * @param sessionKey クライアントのセッションキー
 * @param args クライアントから渡された情報
 * @returns 
 */
export async function registTransaction(
    { sessionKey, operation, args}
    : { sessionKey: string; operation: string; args: object })
{
    const con = await ConnectionPool.getConnection();

    const query = `
        INSERT INTO transaction_queue (id, session_key, operation, param, status)
        VALUES (UUID(), ?, ?, ?, ?)
    `;
    const uuidQuery = `
        SELECT id FROM transaction_queue WHERE id = LAST_INSERT_ID()
    `;

    try {
        await con.beginTransaction();
        await con.execute(query, [sessionKey, operation, args, 'Pending']);
        const [rows] = await con.execute(uuidQuery);

        if ((rows as []).length === 0) {
            throw new Error('not regist')
        }

        await con.commit();

        return (rows as TransactionQueueTable[])[0].id;

    } catch(err) {
        await con.rollback();
        throw new Error('faield transaction regist: ' + err);

    } finally {
        con.release();
    }
}

/**
 * getItemsの結果にトランザクションの内容をマージしたものを返す
 * @param items 
 */
export async function mergeTransactionToResultOfGetItems(
    { items, param, currentMap }
    : { items: ItemDefineWithoutContents[]; param: QueryGetImageArgs; currentMap: CurrentMap }
): Promise<ItemDefineWithoutContents[]> {

    const con = await ConnectionPool.getConnection();

    try {
        // トランザクション情報取得
        const sql = `
            select * from transaction_queue tq 
            where status = 'Pending'
            order by created_at
        `;
        const [ rows ] = await con.execute(sql);

        (rows as TransactionQueueTable[]).reduce((acc, cur) => {
            // TODO: 新規追加されたアイテムがgetItemsの取得範囲内の場合、結果に追加する

            cur.operation
            items.find(item => item.id)
            // 更新されたアイテムがgetItemsに含まれている場合
            // -- getItemsの取得範囲内の場合、結果情報更新
            // -- getItemsの取得範囲外になる場合、結果から除外する

            // TODO: 削除されたアイテムがgetItemsに含まれている場合、結果から除外する
            return acc;
        }, items);

        return [];

    } finally {
        con.release();
    }
}