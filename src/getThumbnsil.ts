import { APIFunc, ConnectionPool } from ".";

/**
 * 指定のページのサムネイル画像Base64を返す
 * @param pageId 
 */
export const getThumbnail: APIFunc<{id: string}, string> = async({ param }) => {
    let pageId = param.id;
    if (pageId.endsWith('/')) {
        pageId = pageId.substring(0, pageId.length-1);
    }
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select thumbnail from contents pc
        where content_page_id = ?`;
        const [rows] = await con.execute(sql, [pageId]);

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