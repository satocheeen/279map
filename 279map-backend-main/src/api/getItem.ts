import { DataId, ItemContentInfo, ItemDefine } from "279map-common";
import { getLogger } from "log4js";
import { ConnectionPool } from "..";
import { ItemContentLink, ItemsTable } from "../../279map-backend-common/src/types/schema";
import { getContentsInfo } from "../getItems";
import { GetItemsByIdParam, GetItemsResult } from "../../279map-api-interface/src";

const apiLogger = getLogger('api');

export async function getItemsById(param: GetItemsByIdParam): Promise<GetItemsResult> {
    const list = [] as ItemDefine[];
    for (const target of param.targets) {
        const item = await getItem(target);
        list.push(item);
    }
    return {
        items: list,
    }
}

export async function getItem(id: DataId): Promise<ItemDefine> {
    const con = await ConnectionPool.getConnection();
    try {

        // 位置コンテンツ
        let sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson
        from items i
        where i.item_page_id = ? and i.data_source_id = ?
        `;
        const params = [id.id, id.dataSourceId];
        const [rows] = await con.execute(sql, params);
        const row = (rows as (ItemsTable & {geojson: any})[])[0]; 

        const contents: ItemContentInfo[] = [];
        let lastEditedTime = row.last_edited_time;

        const contentLinkSql = 'select * from item_content_link where item_page_id = ?';
        const [linkRows] = await con.execute(contentLinkSql, [row.item_page_id]);
        const linkRecords = linkRows as ItemContentLink[];
        if (linkRecords.length > 0) {
            // 配下のコンテンツID取得
            for (const linkRecord of linkRecords) {
                const child = await getContentsInfo(con, linkRecord.content_page_id);
                if (!child) continue;
                contents.push(child);
                // コンテンツリンクの更新日時が新しければ、そちらを更新日時とする
                if (lastEditedTime.localeCompare(linkRecord.last_edited_time) < 0) {
                    lastEditedTime = linkRecord.last_edited_time;
                }
            }
        }

        // itemがnameを持つならname。持たないなら、コンテンツtitle.
        const name = row.name ?? '';

        return {
            id: {
                id: row.item_page_id,
                dataSourceId: row.data_source_id,
            },
            name,
            geoJson: row.geojson,
            geoProperties: row.geo_properties ? JSON.parse(row.geo_properties) : undefined,
            contents,
            lastEditedTime,
        }

    } catch(e) {
        apiLogger.warn('getItem failed', e);
        throw new Error('getItem failed');

    } finally {
        await con.commit();
        con.release();
    }
}