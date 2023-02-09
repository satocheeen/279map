import { getLogger } from "log4js";
import { ConnectionPool } from "..";

const logger = getLogger();

/**
 * 指定のidのアイコン画像Base64を返す
 * @param pageId 
 */
export async function getIcon(param: {id: string}): Promise<string> {
    let pageId = param.id;
    if (pageId.endsWith('/')) {
        pageId = pageId.substring(0, pageId.length-1);
    }
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select base64 from original_icons oi
        where icon_page_id = ?`;
        const [rows] = await con.execute(sql, [pageId]);

        if ((rows as any[]).length === 0) {
            throw 'not found';
        }
        const record = (rows as {base64: string}[])[0];
        if (!record.base64) {
            throw 'not found';
        }
        return record.base64;

    } catch(e) {
        logger.warn(e);
        await con.rollback();
        throw e;

    } finally {
        await con.commit();
        con.release();
    }

}