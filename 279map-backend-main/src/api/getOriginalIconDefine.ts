import { ConnectionPool } from "..";
import { types } from "279map-backend-common";
import { GetOriginalIconDefineResult } from "../../279map-api-interface/src";
import { IconDefine, MapKind } from "279map-backend-common";

export async function getOriginalIconDefine(currentMap: types.CurrentMap): Promise<GetOriginalIconDefineResult> {
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

        const icons = (rows as types.schema.OriginalIconsTable[]).map((row): IconDefine => {
            return {
                id: row.icon_page_id,
                caption: row.caption,
                imagePath: `https://${process.env.HOST}/api/geticon?id=${row.icon_page_id}`,
                useMaps: [MapKind.Real, MapKind.Virtual],   // TODO:
            }
        });

        return icons;

    } finally {
        await con.rollback();
        con.release();
    }
}