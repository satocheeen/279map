import { ConnectionPool } from "..";
import { getIcon } from "./getIcon";
import { OriginalIconsTable } from "../../279map-backend-common/src/types/schema";
import { IconDefine, MapKind } from "../types-common/common-types";

export async function getOriginalIconDefine(mapId: string): Promise<IconDefine[]> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = `
        select icon_page_id, oi.caption, use_maps from original_icons oi 
        where oi.map_page_id = ?
        `;
        const [rows] = await con.execute(sql, [mapId]);

        const icons = await Promise.all((rows as OriginalIconsTable[]).map(async(row): Promise<IconDefine|undefined> => {
            const base64 = await getIcon({id: row.icon_page_id});
            if (!base64) return;
            
            return {
                type: 'original',
                id: row.icon_page_id,
                caption: row.caption,
                imagePath: 'data:image/' + base64,
                useMaps: row.use_maps.split(',').map(mapKindStr => {
                    return mapKindStr as MapKind;
                }),
            }
        }));

        return icons.filter(icon => icon) as IconDefine[];

    } finally {
        await con.rollback();
        con.release();
    }
}