import { ConnectionPool } from ".";
import { EventDefine, CurrentMap, schema } from "279map-backend-common";
import { getBelongingItem } from "./util/utility";
import { GetEventParam, GetEventsResult } from "../279map-api-interface/src";

export async function getEvents(param: GetEventParam, currentMap: CurrentMap): Promise<GetEventsResult> {
    if (!currentMap) {
        throw 'no currentmap';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;

    const con = await ConnectionPool.getConnection();

    try {
        // get contents which has date in the map
        const sql = `
            select c.* from contents c
            inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
            where date is not null and mdl.map_page_id = ?
            order by date
            `;
        const [rows] = await con.execute(sql, [mapPageId]);
        let records = (rows as schema.ContentsTable[]);
        if (param.dataSourceIds) {
            // filter by whter exist in the datasources
            records = records.filter(rec => {
                return param.dataSourceIds?.includes(rec.data_source_id);
            });
        }
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

