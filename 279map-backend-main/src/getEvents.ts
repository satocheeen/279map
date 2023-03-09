import { ConnectionPool } from ".";
import { types } from "279map-backend-common";
import { getBelongingItem } from "./util/utility";
import { GetEventsResult } from "../279map-api-interface/src";
import { EventDefine } from "279map-backend-common";

export async function getEvents(currentMap: types.CurrentMap): Promise<GetEventsResult> {
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
            inner join contents_db_info cdi ON c.contents_db_id = cdi.contents_db_id 
            where date is not null and cdi.map_page_id = ?
            order by date
            `;
        const [rows] = await con.execute(sql, [mapPageId]);
        // filter by whether exist in the map kind
        const events = [] as EventDefine[];
        for (const row of (rows as types.schema.ContentsTable[])) {
            const itemList = await getBelongingItem(con, row, mapPageId, mapKind);
            if (itemList) {
                itemList.forEach(item => {
                    events.push({
                        date: row.date as Date,
                        item_id: item.item_page_id,
                        content_id: row.content_page_id,
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

