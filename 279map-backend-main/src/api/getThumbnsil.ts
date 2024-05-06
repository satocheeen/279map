import { ConnectionPool } from "..";
import { DataId, ImagesTable } from "../../279map-backend-common/src";

/**
 * 指定のコンテンツのサムネイル画像取得
 * 複数の画像が紐づく場合は、代表１つを取得して返す
 * @param pageId 
 */
export async function getThumbnail(contentId: DataId): Promise<string> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select thumbnail from images im
        where content_data_id = ?
        `;
        const [rows] = await con.execute(sql, [contentId]);

        if ((rows as any[]).length === 0) {
            throw 'not found';
        }
        const record = (rows as ImagesTable[])[0];
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