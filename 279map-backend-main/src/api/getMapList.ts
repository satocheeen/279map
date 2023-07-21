import { schema } from "279map-backend-common";
import { ConnectionPool, authManagementClient } from "..";
import { MapInfo } from "../../279map-api-interface/src";

/**
 * ユーザがアクセス可能な地図一覧を返す
 * @param userId 
 * @returns 
 */
export async function getMapList(userId: string | undefined): Promise<MapInfo[]> {
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();
        
        // Public地図一覧取得
        const selectPublicQuery = 'select * from map_page_info where public_range = ?';
        const [rows] = await con.execute(selectPublicQuery, [schema.PublicRange.Public]);
        const records = rows as schema.MapPageInfoTable[];
        const publicMapList = records.map((record): MapInfo => {
            return {
                mapId: record.map_page_id,
                name: record.title,
            };
        });

        if (!userId) {
            // 未ログインユーザは、Public地図一覧のみ返す
            return publicMapList;
        }

        // ユーザがアクセス権限のあるPrivate地図一覧を取得
        const accessableMapIdList = await authManagementClient.getUserMapList(userId);
        const privateMapList = [] as MapInfo[];
        for (const mapId of accessableMapIdList) {
            const selectPublicQuery = 'select * from map_page_info where map_page_id = ? and  public_range = ?';
            const [rows] = await con.execute(selectPublicQuery, [mapId, schema.PublicRange.Private]);
            const records = rows as schema.MapPageInfoTable[];
            if (records.length > 0) {
                privateMapList.push({
                    mapId: records[0].map_page_id,
                    name: records[0].title,
                })
            }
        }

        return publicMapList.concat(privateMapList);

    } finally {
        await con.rollback();
        con.release();
    }

}