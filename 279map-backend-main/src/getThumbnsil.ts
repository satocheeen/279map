import { DataId } from "279map-common";
import { ConnectionPool } from ".";

/**
 * 指定のページのサムネイル画像Base64を返す
 * @param pageId 
 */
export async function getThumbnail(contentId: DataId): Promise<string> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select thumbnail from contents pc
        where content_page_id = ? and data_source_id = ?`;
        const [rows] = await con.execute(sql, [contentId.id, contentId.dataSourceId]);

        if ((rows as any[]).length === 0) {
            throw 'not found';
        }
        const record = (rows as any[])[0];
        if (!record.thumbnail) {
            throw 'not found';
        }
        return record.thumbnail;
        // return 'data:image/jpeg;base64,' + record.thumbnail;

    } finally {
        await con.commit();
        con.release();
    }

}