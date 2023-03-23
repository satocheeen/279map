import { ConnectionPool } from '..';
import { types, MapKind, Extent } from '279map-backend-common';
import mysql, { PoolConnection } from 'mysql2/promise';

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

/**
 * 指定のコンテンツと繋がっているアイテムを返す
 * @param con 
 * @param content_page_id 
 * @param mapPageId 
 * @param mapKind 
 * @returns 
 */
async function getItemHasTheContent(con: PoolConnection, content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<types.schema.ItemsTable[]> {
    try {
        const kind = getDataSourceKindsFromMapKind(mapKind, {item: true});
        const sql = `
        select i.* from items i
        inner join data_source ds on ds.data_source_id = ds.data_source_id 
        inner join item_content_link icl on icl.item_page_id = i.item_page_id 
        where icl.content_page_id = ? and ds.map_page_id = ? and ds.kind in (?)
        `;
        const query = mysql.format(sql, [content_page_id, mapPageId, kind]);
        const [rows] = await con.execute(query);
        // const [rows] = await con.execute(sql, [content_page_id, mapPageId, kind]);
        return (rows as types.schema.ItemsTable[]);

    } catch(e) {
        throw 'getItemHasTheContent' + e;

    }
}

/**
 * 指定の地図種別に対応するDataSourceKindを返す
 * @param mapKind 
 * @returns 
 */
export function getDataSourceKindsFromMapKind(mapKind: MapKind, contain: {item?: boolean; content?: boolean; track?: boolean}): types.schema.DataSourceKind[] {
    const kindSet = new Set<types.schema.DataSourceKind>();
    if (contain.item) {
        if (mapKind === MapKind.Real) {
            kindSet.add(types.schema.DataSourceKind.RealItem);
            kindSet.add(types.schema.DataSourceKind.RealItemContent);
        } else {
            kindSet.add(types.schema.DataSourceKind.VirtualItem);
        }
    }
    if (contain.content) {
        kindSet.add(types.schema.DataSourceKind.Content);
        if (mapKind === MapKind.Real) {
            kindSet.add(types.schema.DataSourceKind.RealItemContent);
        }
    }
    if (contain.track) {
        if (mapKind === MapKind.Real) {
            kindSet.add(types.schema.DataSourceKind.RealTrack);
        }
    }

    return Array.from(kindSet);
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