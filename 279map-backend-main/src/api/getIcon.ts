import { getLogger } from "log4js";
import { ConnectionPool } from "..";

const logger = getLogger();

/**
 * 指定のidのアイコン画像Base64を返す
 * @param pageId 
 * @return アイコン画像Base64。存在しない場合、undefined
 */
export async function getIcon(param: {id: string}): Promise<string|undefined> {
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
            logger.warn('base64 not found');
            return;
        }
        const record = (rows as {base64: string}[])[0];
        if (!record.base64) {
            logger.warn('base64 not found');
            return;
        }
        return record.base64;

    } catch(e) {
        logger.warn(e);
        await con.rollback();
        return;

    } finally {
        await con.commit();
        con.release();
    }

}