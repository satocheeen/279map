import { APIFunc, ConnectionPool } from "..";
import { types } from "279map-backend-common";
import { GetOriginalIconDefineResult } from "../../279map-api-interface/src";
import { IconDefine, MapKind } from "279map-common";

export const getOriginalIconDefine: APIFunc<void, GetOriginalIconDefineResult> = async({ currentMap }) => {
    const pageId = currentMap?.mapPageId;
    if (!pageId) {
        throw 'mapId is undefined.';
    }

    const con = await ConnectionPool.getConnection();
    try {
        const sql = `
        select icon_page_id, oi.caption from original_icons oi 
        inner join contents_db_info cdi on oi.contents_db_id = cdi.contents_db_id 
        where cdi.map_page_id = ?
        `;
        const [rows] = await con.execute(sql, [pageId]);

        const icons = (rows as types.OriginalIconsTable[]).map((row): IconDefine => {
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