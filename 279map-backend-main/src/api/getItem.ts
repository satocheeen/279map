import { getLogger } from "log4js";
import { ConnectionPool } from "..";
import { ItemContentLink, ItemsTable } from "../../279map-backend-common/src/types/schema";
import { getContentsInfo, getImageContentId } from "../getItems";
import { QueryGetItemsByIdArgs } from "../graphql/__generated__/types";
import { DataId } from "../types-common/common-types";
import { ItemDefineWithoudContents } from "../types";

const apiLogger = getLogger('api');

export async function getItemsById(param: QueryGetItemsByIdArgs): Promise<ItemDefineWithoudContents[]> {
    const list = [] as ItemDefineWithoudContents[];
    for (const target of param.targets) {
        const item = await getItem(target);
        if (item)
            list.push(item);
    }
    return list;
}

export async function getItem(id: DataId): Promise<ItemDefineWithoudContents|undefined> {
    const con = await ConnectionPool.getConnection();
    try {

        // 位置コンテンツ
        let sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson, c.title
        from items i
        left join contents c on c.content_page_id = i.item_page_id and c.data_source_id = i.data_source_id 
        where i.item_page_id = ? and i.data_source_id = ?
        `;
        const params = [id.id, id.dataSourceId];
        const [rows] = await con.execute(sql, params);
        if ((rows as []).length === 0) return;
        const row = (rows as (ItemsTable & {geojson: any; title: string | null})[])[0]; 

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

        return {
            id: {
                id: row.item_page_id,
                dataSourceId: row.data_source_id,
            },
            name: row.title ?? '',
            geometry: row.geojson,
            geoProperties: row.geo_properties ? JSON.parse(row.geo_properties) : undefined,
            hasContents: contents.length > 0,
            hasImageContentId: getImageContentId(contents),
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

export type ItemContentInfo = {
    id: DataId;
    hasImage: boolean;
    children: ItemContentInfo[];
}
