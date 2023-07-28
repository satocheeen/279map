import { ConnectionPool } from '.';
import { getLogger } from 'log4js';
import { MapPageInfoTable } from '../279map-backend-common/src/types/schema';

const apiLogger = getLogger('api');

/**
 * 指定のidに該当する地図情報を返す。
 * @param mapId 地図ID。該当するものが存在しない場合は、null。
 */
export async function getMapInfoById(mapId: string): Promise<MapPageInfoTable|null> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'SELECT * FROM map_page_info WHERE map_page_id = ?';
        const [rows] = await con.execute(sql, [mapId, mapId]);
        const records = rows as MapPageInfoTable[];
        if (records.length === 0) {
            return null;
        }
        return records[0];

    } catch(e) {
        apiLogger.warn('get map_page_id failed.', mapId, e);
        return null;

    } finally {
        await con.rollback();
        con.release();

    }
}
