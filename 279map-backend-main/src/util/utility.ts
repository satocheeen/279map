import { ConnectionPool } from '..';
import { MapKind, Extent, DataId } from '279map-common';
import mysql, { PoolConnection } from 'mysql2/promise';
import { ContentsTable, ItemsTable } from '../../279map-backend-common/src/types/schema';
import { CurrentMap } from '../../279map-backend-common/src';

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
export async function getBelongingItem(con: PoolConnection, content: ContentsTable, mapPageId: string, mapKind: MapKind): Promise<ItemsTable[]|null> {
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
async function getItemHasTheContent(con: PoolConnection, content_page_id: string, mapPageId: string, mapKind: MapKind): Promise<ItemsTable[]> {
    try {
        const sql = `
        select i.* from items i
        inner join data_source ds on ds.data_source_id = i.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id
        inner join item_content_link icl on icl.item_page_id = i.item_page_id 
        where icl.content_page_id = ? and mdl.map_page_id = ? and i.map_kind = ?
        `;
        const query = mysql.format(sql, [content_page_id, mapPageId, mapKind]);
        const [rows] = await con.execute(query);
        // const [rows] = await con.execute(sql, [content_page_id, mapPageId, kind]);
        return (rows as ItemsTable[]);

    } catch(e) {
        throw 'getItemHasTheContent' + e;

    }
}

export async function getContent(content_id: DataId): Promise<ContentsTable|null> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = "select * from contents where content_page_id = ? and data_source_id = ?";
        const [rows] = await con.execute(sql, [content_id.id, content_id.dataSourceId]);
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
        const [rows] = await myCon.execute(sql, [currentMap.mapId, currentMap.mapKind, contentId.id, contentId.dataSourceId]);
        if ((rows as ItemsTable[]).length > 0) {
            const record = (rows as ItemsTable[])[0];
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
        const contentRecord = (contentRows as ContentsTable[])[0];
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

/**
 * 2つのエクステントの関係を判断する
 * @param ext1 
 * @param ext2 
 * @return ext2がext1に包含されている場合、1。ext1がext2に包含されている場合、2。包含関係にない場合、0。
 */
export function checkContaining(ext1: Extent, ext2: Extent) {
    const isContain1in2 = (ext1: Extent, ext2: Extent) => {
        if (ext1[0] < ext2[0]) return false;
        if (ext1[2] > ext2[2]) return false;
        if (ext1[1] < ext2[1]) return false;
        if (ext1[3] > ext2[3]) return false;
        return true;
    }

    if (isContain1in2(ext1, ext2)) {
        return 2;
    }
    if (isContain1in2(ext2, ext1)) {
        return 1;
    }
    return 0;
}