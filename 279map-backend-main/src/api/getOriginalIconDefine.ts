import { ConnectionPool } from "..";
import { CurrentMap, schema } from "279map-backend-common";
import { GetOriginalIconDefineResult } from "../../279map-api-interface/src";
import { IconDefine, MapKind } from "279map-backend-common";
import { getIcon } from "./getIcon";

export async function getOriginalIconDefine(currentMap: CurrentMap): Promise<GetOriginalIconDefineResult> {
    const pageId = currentMap?.mapId;
    if (!pageId) {
        throw 'mapId is undefined.';
    }

    const con = await ConnectionPool.getConnection();
    try {
        const sql = `
        select icon_page_id, oi.caption from original_icons oi 
        where oi.map_page_id = ?
        `;
        const [rows] = await con.execute(sql, [pageId]);


        const icons = await Promise.all((rows as schema.OriginalIconsTable[]).map(async(row): Promise<IconDefine> => {
            const base64 = await getIcon({id: row.icon_page_id});
            return {
                id: row.icon_page_id,
                caption: row.caption,
                imagePath: 'data:image/' + base64,
                useMaps: [MapKind.Real, MapKind.Virtual],   // TODO:
            }
        }));

        return icons;

    } finally {
        await con.rollback();
        con.release();
    }
}