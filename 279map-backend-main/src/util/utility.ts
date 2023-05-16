import { ConnectionPool } from '..';
import { schema, MapKind, Extent, DataId,  CurrentMap} from '279map-backend-common';
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
export async function getBelongingItem(con: PoolConnection, content: schema.ContentsTable, mapPageId: string, mapKind: MapKind): Promise<schema.ItemsTable[]|null> {
    const items = await getItemHasTheContent(con, content.content_page_id, mapPageId, mapKind);
    if (items.length > 0) {
        return items;
    }
    if (!content.parent_id || !content.parent_datasource_id) {
        return null;
    }
    const parent = await getContent({
        id: content.parent_id,
        dataSourceId: content.parent_datasource_id
    });
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
async function getItemHasTheContent(con: PoolConnection, content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<schema.ItemsTable[]> {
    try {
        const sql = `
        select i.* from items i
        inner join data_source ds on ds.data_source_id = ds.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
        inner join item_content_link icl on icl.item_page_id = i.item_page_id 
        where icl.content_page_id = ? and mdl.map_page_id = ? and i.map_kind = ?
        `;
        const query = mysql.format(sql, [content_page_id, mapPageId, mapKind]);
        const [rows] = await con.execute(query);
        // const [rows] = await con.execute(sql, [content_page_id, mapPageId, kind]);
        return (rows as schema.ItemsTable[]);

    } catch(e) {
        throw 'getItemHasTheContent' + e;

    }
}

export async function getContent(content_id: DataId): Promise<schema.ContentsTable|null> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = "select * from contents where content_page_id = ? and data_source_id = ?";
        const [rows] = await con.execute(sql, [content_id.id, content_id.dataSourceId]);
        if ((rows as []).length === 0) {
            return null;
        }
        return (rows as schema.ContentsTable[])[0];

    } catch(e) {
        throw 'getContent' + e;
    } finally {
        await con.rollback();
        con.release();
    }
}

/**
 * 指定のデータソースが編集可能なデータソースか返す
 * @param data_source_id 
 * @param sourceKind
 * @return 編集可能な場合、true
 */
export async function isReadonlyDataSource(data_source_id: string): Promise<boolean> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = "select * from data_source where data_source_id = ?";
        const [rows] = await con.execute(sql, [data_source_id]);
        if ((rows as []).length === 0) {
            return false;
        }
        const record = (rows as schema.DataSourceTable[])[0];
        return record.readonly;

    } catch(e) {
        throw new Error('isReadonlyDataSource error: ' + e);
    } finally {
        await con.commit();
        con.release();
    }

}

/**
 * 指定のコンテンツの祖先にいるアイテムIDを返す
 * @param contentId 
 */
export async function getAncestorItemId(con: PoolConnection | undefined, contentId: DataId, currentMap: CurrentMap): Promise<DataId | undefined> {
    const myCon = con ?? await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from items i
        inner join item_content_link icl on icl.item_page_id = i.item_page_id  and icl.item_datasource_id = i.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = icl.item_datasource_id 
        where mdl.map_page_id = ? and i.map_kind = ? and icl.content_page_id = ? and icl.content_datasource_id = ?
        `;
        console.log('debug', currentMap.mapId, currentMap.mapKind, contentId.id, contentId.dataSourceId);
        const [rows] = await myCon.execute(sql, [currentMap.mapId, currentMap.mapKind, contentId.id, contentId.dataSourceId]);
        if ((rows as schema.ItemsTable[]).length > 0) {
            const record = (rows as schema.ItemsTable[])[0];
            return {
                id: record.item_page_id,
                dataSourceId: record.data_source_id,
            };
        }

        // 対応するアイテムが存在しない場合は、親コンテンツを辿る
        const contentQuery = 'select * from contents where content_page_id = ? and data_source_id = ?';
        const [contentRows] = await myCon.execute(contentQuery, [contentId.id, contentId.dataSourceId]);
        if ((contentRows as []).length === 0) {
            return;
        }
        const contentRecord = (contentRows as schema.ContentsTable[])[0];
        if (!contentRecord.parent_id || !contentRecord.parent_datasource_id) {
            return;
        }
        const ancestor = await getAncestorItemId(
            myCon,
            {
                id: contentRecord.parent_id,
                dataSourceId: contentRecord.data_source_id,
            },
            currentMap);
        return ancestor;
    
    } finally {
        if (!con) {
            await myCon.commit();
            myCon.release();
        }
    }

}