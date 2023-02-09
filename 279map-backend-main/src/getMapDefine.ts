import { ConnectionPool } from '.';
import { getLogger } from 'log4js';

const apiLogger = getLogger('api');

/**
 * 指定のidまたはaliasに該当する地図IDを返す。
 * @param mapIdOrAlias 地図ID or 地図Alias。該当するものが存在しない場合は、null。
 */
export async function getMapId(mapIdOrAlias: string): Promise<string|null> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'SELECT map_page_id FROM map_page_info WHERE map_page_id = ? OR alias = ?';
        const [rows] = await con.execute(sql, [mapIdOrAlias, mapIdOrAlias]);
        const records = rows as {map_page_id: string}[];
        if (records.length === 0) {
            return null;
        }
        return records[0].map_page_id;

    } catch(e) {
        apiLogger.warn('get map_page_id failed.', mapIdOrAlias, e);
        return null;

    } finally {
        await con.rollback();
        con.release();

    }
}
