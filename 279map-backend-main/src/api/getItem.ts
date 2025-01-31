import { getLogger } from "log4js";
import { ConnectionPool } from "..";
import { GeometryItemsTable } from "../../279map-backend-common/src/types/schema";
import { QueryGetItemsByIdArgs } from "../graphql/__generated__/types";
import { DataId, DatasourceLocationKindType, MapKind } from "../types-common/common-types";
import { ItemDefineWithoutContents } from "../types";
import { DatasTable } from "../../279map-backend-common/dist";

const apiLogger = getLogger('api');

export async function getItemsById(param: QueryGetItemsByIdArgs): Promise<ItemDefineWithoutContents[]> {
    const list = [] as ItemDefineWithoutContents[];
    for (const target of param.targets) {
        const item = await getItem(target);
        if (item)
            list.push(item);
    }
    return list;
}

export async function getItem(id: DataId): Promise<ItemDefineWithoutContents|undefined> {
    const con = await ConnectionPool.getConnection();
    try {

        // 位置コンテンツ
        let sql = `
        select gi.*, d.data_source_id, ST_AsGeoJSON(gi.feature) as geojson, JSON_UNQUOTE(JSON_EXTRACT(c.contents , '$.title')) as title, d.last_edited_time, ds.location_kind  
        from geometry_items gi 
        inner join datas d on d.data_id = gi.data_id 
        inner join contents c on c.data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        where gi.data_id = ?
        `;
        const params = [id];
        const [rows] = await con.execute(sql, params);
        if ((rows as []).length === 0) return;
        const row = (rows as (GeometryItemsTable & DatasTable & {geojson: any; title: string | null; last_edited_time: string; location_kind: DatasourceLocationKindType})[])[0]; 

        // const contents: ItemContentInfo[] = [];
        let lastEditedTime = row.last_edited_time;

        // const contentLinkSql = 'select * from item_content_link where item_page_id = ?';
        // const [linkRows] = await con.execute(contentLinkSql, [row.item_page_id]);
        // const linkRecords = linkRows as ItemContentLink[];
        // if (linkRecords.length > 0) {
        //     // 配下のコンテンツID取得
        //     for (const linkRecord of linkRecords) {
        //         const child = await getContentsInfo(con, linkRecord.content_page_id);
        //         if (!child) continue;
        //         contents.push(child);
        //         // コンテンツリンクの更新日時が新しければ、そちらを更新日時とする
        //         if (lastEditedTime.localeCompare(linkRecord.last_edited_time) < 0) {
        //             lastEditedTime = linkRecord.last_edited_time;
        //         }
        //     }
        // }

        return {
            id: row.data_id,
            datasourceId: row.data_source_id,
            mapKind: row.location_kind === DatasourceLocationKindType.VirtualItem ? MapKind.Virtual : MapKind.Real,
            name: row.title ?? '',
            geometry: row.geojson,
            geoProperties: row.geo_properties ? JSON.parse(row.geo_properties) : undefined,
            // hasContents: contents.length > 0,
            // hasImageContentId: getImageContentId(contents),
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
