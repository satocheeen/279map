import { ConnectionPool, authManagementClient } from "..";
import { MapPageInfoTable, PublicRange } from "../../279map-backend-common/src/types/schema";
import { MapListItem } from "../graphql/__generated__/types";

/**
 * ユーザがアクセス可能な地図一覧を返す
 * @param userId 
 * @returns 
 */
export async function getMapList(userId: string | undefined): Promise<MapListItem[]> {
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();
        
        // Public地図一覧取得
        const selectPublicQuery = 'select * from map_page_info where public_range = ?';
        const [rows] = await con.execute(selectPublicQuery, [PublicRange.Public]);
        const records = rows as MapPageInfoTable[];
        const publicMapList = records.map((record): MapListItem => {
            return {
                mapId: record.map_page_id,
                name: record.title,
                description: record.description,
                thumbnail: record.thumbnail ? 'data:image/' + record.thumbnail : undefined,
        };
        });

        if (!userId) {
            // 未ログインユーザは、Public地図一覧のみ返す
            return publicMapList;
        }

        // ユーザがアクセス権限のあるPrivate地図一覧を取得
        const accessableMapIdList = await authManagementClient.getUserMapList(userId);
        const privateMapList = [] as MapListItem[];
        for (const mapId of accessableMapIdList) {
            const selectPublicQuery = 'select * from map_page_info where map_page_id = ? and  public_range = ?';
            const [rows] = await con.execute(selectPublicQuery, [mapId, PublicRange.Private]);
            const records = rows as MapPageInfoTable[];
            if (records.length > 0) {
                privateMapList.push({
                    mapId: records[0].map_page_id,
                    name: records[0].title,
                    description: records[0].description,
                    thumbnail: records[0].thumbnail ? 'data:image/' + records[0].thumbnail : undefined,
                })
            }
        }

        return publicMapList.concat(privateMapList);

    } finally {
        await con.rollback();
        con.release();
    }

}