import { ConnectionPool } from ".";
import { DataId, ImagesTable } from "../279map-backend-common/src";

/**
 * 指定のコンテンツのサムネイル画像取得
 * 複数の画像が紐づく場合は、代表１つを取得して返す
 * @param pageId 
 */
export async function getThumbnail(contentId: DataId): Promise<string> {
    const con = await ConnectionPool.getConnection();

    try {
        // ログイン中の地図に属する画像のみ取得できるようにしている（不正取得防止）
        const sql = `
        select thumbnail from images im
        where content_page_id = ? and data_source_id = ?
        `;
        const [rows] = await con.execute(sql, [contentId.id, contentId.dataSourceId]);

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