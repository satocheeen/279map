import { Extent } from 'ol/extent';
import { ConnectionPool } from '..';
import { MapKind } from '../../../common/src/types/common';
import { ContentsTable, ItemsTable } from '../../../common/src/types/schema';

export function getExtentWkt(ext: Extent): string {
    const [lon1, lat1, lon2, lat2] = ext;
    return `POLYGON((${lon1} ${lat1},${lon1} ${lat2},${lon2} ${lat2},${lon2} ${lat1},${lon1} ${lat1}))`;
}

export function convertBase64ToBinary(base64: string) {
    // format情報抽出
    const regex = /^([^;]*);?base64,(.*)/;
    const hit = base64.match(regex);
    if (!hit) {
        throw 'image format undefined.';
    }
    const format = hit[1];
    const body = hit[2];

    const img = Buffer.from(body, 'base64');

    return {
        contentType: 'image/' + format,
        binary: img,
    };
}

/**
 * 指定のコンテンツを保持する指定の地図内のアイテム情報を返す
 * @param content 
 * @param mapPageId 
 * @param mapKind 
 * @returns 
 */
export async function getBelongingItem(content: ContentsTable, mapPageId: string, mapKind: MapKind): Promise<ItemsTable[]|null> {
    const items = await getItemHasTheContent(content.content_page_id, mapPageId, mapKind);
    if (items.length > 0) {
        return items;
    }
    if (!content.parent_id) {
        return null;
    }
    const parent = await getContent(content.parent_id);
    if (!parent) {
        return null;
    }
    return await getBelongingItem(parent, mapPageId, mapKind);
    
}

async function getItemHasTheContent(content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<ItemsTable[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
            select * from items i
            inner join contents_db_info cdi ON i.contents_db_id = cdi.contents_db_id
            where i.content_page_id = ? and cdi.map_page_id = ? and i.map_kind = ?
            `;
        const [rows] = await con.execute(sql, [content_page_id, mapPageId, mapKind]);
        return (rows as ItemsTable[]);

    } catch(e) {
        throw 'getItemHasTheContent' + e;

    } finally {
        await con.rollback();
        con.release();
    }

}
export async function getContent(content_page_id: string): Promise<ContentsTable|null> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = "select * from contents where content_page_id = ?";
        const [rows] = await con.execute(sql, [content_page_id]);
        if ((rows as []).length === 0) {
            return null;
        }
        return (rows as ContentsTable[])[0];

    } catch(e) {
        throw 'getContent' + e;
    } finally {
        await con.rollback();
        con.release();
    }
}