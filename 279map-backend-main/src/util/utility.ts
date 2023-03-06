import { Extent } from '279map-common'
import { ConnectionPool } from '..';
import { MapKind } from '279map-common';
import { types } from '279map-backend-common';
import { PoolConnection } from 'mysql2/promise';

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
export async function getBelongingItem(con: PoolConnection, content: types.schema.ContentsTable, mapPageId: string, mapKind: MapKind): Promise<types.schema.ItemsTable[]|null> {
    const items = await getItemHasTheContent(con, content.content_page_id, mapPageId, mapKind);
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
    return await getBelongingItem(con, parent, mapPageId, mapKind);
}

async function getItemHasTheContent(con: PoolConnection, content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<types.schema.ItemsTable[]> {
    try {
        const sql = `
        select * from items i
        inner join contents_db_info cdi ON i.contents_db_id = cdi.contents_db_id
        inner join item_content_link icl on icl.item_page_id = i.item_page_id 
        where icl.content_page_id = ? and cdi.map_page_id = ? and i.map_kind = ?
        `;
        const [rows] = await con.execute(sql, [content_page_id, mapPageId, mapKind]);
        console.log('rows', rows);
        return (rows as types.schema.ItemsTable[]);

    } catch(e) {
        throw 'getItemHasTheContent' + e;

    }

}
export async function getContent(content_page_id: string): Promise<types.schema.ContentsTable|null> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = "select * from contents where content_page_id = ?";
        const [rows] = await con.execute(sql, [content_page_id]);
        if ((rows as []).length === 0) {
            return null;
        }
        return (rows as types.schema.ContentsTable[])[0];

    } catch(e) {
        throw 'getContent' + e;
    } finally {
        await con.rollback();
        con.release();
    }
}