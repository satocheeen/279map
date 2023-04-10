import { ConnectionPool } from '.';
import { getLogger } from 'log4js';
import { schema } from '279map-backend-common';

const apiLogger = getLogger('api');

/**
 * 指定のidまたはaliasに該当する地図情報を返す。
 * @param mapIdOrAlias 地図ID or 地図Alias。該当するものが存在しない場合は、null。
 */
export async function getMapInfoByIdOrAlias(mapIdOrAlias: string): Promise<schema.MapPageInfoTable|null> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'SELECT * FROM map_page_info WHERE map_page_id = ? OR alias = ?';
        const [rows] = await con.execute(sql, [mapIdOrAlias, mapIdOrAlias]);
        const records = rows as schema.MapPageInfoTable[];
        if (records.length === 0) {
            return null;
        }
        return records[0];

    } catch(e) {
        apiLogger.warn('get map_page_id failed.', mapIdOrAlias, e);
        return null;

    } finally {
        await con.rollback();
        con.release();

    }
}
