import { ConnectionPool } from ".";
import { EventDefine, CurrentMap, schema } from "279map-backend-common";
import { getBelongingItem } from "./util/utility";
import { GetEventParam, GetEventsResult } from "../279map-api-interface/src";
import { PoolConnection } from "mysql2/promise";

export async function getEvents(param: GetEventParam, currentMap: CurrentMap): Promise<GetEventsResult> {
    if (!currentMap) {
        throw 'no currentmap';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;

    const con = await ConnectionPool.getConnection();

    try {
        // get contents which has date in the map
        const records = await getContentsHavingDate(con, mapPageId, param.dataSourceIds);
        // filter by whether exist in the map kind
        const events = [] as EventDefine[];
        for (const row of records) {
            const itemList = await getBelongingItem(con, row, mapPageId, mapKind);
            if (itemList) {
                itemList.forEach(item => {
                    events.push({
                        date: row.date as string,
                        item_id: {
                            id: item.item_page_id,
                            dataSourceId: item.data_source_id,
                        },
                        content_id: {
                            id: row.content_page_id,
                            dataSourceId: row.data_source_id,
                        },
                    });
                });
            }
        }

        return {
            events,
        };

    } catch(e) {
        throw  'getEvents error' + e;

    } finally {
        await con.rollback();
        con.release();
    }
}

/**
 * 指定の地図上のdateを保持するコンテンツ一覧を返す
 * @param mapId 地図ID
 * @param dataSourceIds 指定されている場合は、このデータソースのコンテンツに限定する
 */
async function getContentsHavingDate(con: PoolConnection, mapId: string, dataSourceIds?: string[]): Promise<schema.ContentsTable[]> {
    if (!dataSourceIds) {
        const sql = `
        select c.* from contents c
        inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
        where date is not null and mdl.map_page_id = ?
        order by date
        `;
        const [rows] = await con.execute(sql, [mapId]);
        return (rows as schema.ContentsTable[]);
    }

    // データソース指定されている場合は、データソースごとにレコード取得
    const result = [] as schema.ContentsTable[];
    for (const dataSourceId of dataSourceIds) {
        const sql = `
        select c.* from contents c
        inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
        where date is not null and mdl.map_page_id = ? and c.data_source_id = ?
        order by date
        `;
        const [rows] = await con.execute(sql, [mapId, dataSourceId]);
        Array.prototype.push.apply(result, (rows as schema.ContentsTable[]));
    }
    return result;
}