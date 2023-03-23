import { schema } from "279map-backend-common";
import { ConnectionPool } from "..";
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

        // ユーザがアクセス権限のある地図一覧を取得
        const selectPrivateQuery = `
        select mpi.* from map_page_info mpi 
        inner join map_user mu on mpi.map_page_id = mu.map_page_id
        where mu.user_id = ? and public_range = ?
        `;
        const [rowsPrivate] = await con.execute(selectPrivateQuery, [userId, schema.PublicRange.Private]);
        const privateMapList = (rowsPrivate as schema.MapPageInfoTable[]).map((record): MapInfo => {
            return {
                mapId: record.map_page_id,
                name: record.title,
            }
        });

        return publicMapList.concat(privateMapList);

    } finally {
        await con.rollback();
        con.release();
    }

}