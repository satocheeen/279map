import { ConnectionPool } from "..";
import { schema } from '279map-backend-common';

/**
 * 指定の地図のユーザ情報を取得する
 * @param mapId 
 * @param userId 
 * @return ユーザ情報。該当するデータが存在しない場合、null。
 */
export async function getMapUser(mapId: string, userId: string): Promise<schema.MapUserTable | null> {
    const con = await ConnectionPool.getConnection();
    
    try {
        const sql = 'SELECT * FROM map_user WHERE map_page_id = ? AND user_id = ?';
        const [rows] = await con.execute(sql, [mapId, userId]);
        const records = (rows as schema.MapUserTable[]);

        if (records.length === 0) {
            return null;
        }
        
        return records[0];

    } catch(e) {
        throw new Error('select map_user table failed.');
    } finally {
        await con.rollback();
        con.release();
    }

}