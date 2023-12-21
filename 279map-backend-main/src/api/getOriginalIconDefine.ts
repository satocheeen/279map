import { ConnectionPool } from "..";
import { getIcon } from "./getIcon";
import { CurrentMap } from "../../279map-backend-common/src";
import { OriginalIconsTable } from "../../279map-backend-common/src/types/schema";
import { IconDefine, MapKind } from "../graphql/__generated__/types";

export async function getOriginalIconDefine(currentMap: CurrentMap): Promise<IconDefine[]> {
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


        const icons = await Promise.all((rows as OriginalIconsTable[]).map(async(row): Promise<IconDefine> => {
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