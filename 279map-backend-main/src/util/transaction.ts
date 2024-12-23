/**
 * トランザクションテーブル関連の処理群
 */

import { ConnectionPool } from "..";
import { TransactionQueueTable } from "../../279map-backend-common/src";

export async function registTransaction(sessionId: string, args: object) {
    const con = await ConnectionPool.getConnection();

    const query = `
        INSERT INTO transaction_queue (id, session_key, operation, status)
        VALUES (UUID(), ?, ?, ?)
    `;
    const uuidQuery = `
        SELECT id FROM transaction_queue WHERE id = LAST_INSERT_ID()
    `;

    try {
        await con.beginTransaction();
        await con.execute(query, [sessionId, args, 'Pending']);
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