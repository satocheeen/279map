import { ConnectionPool } from "..";
import { MapPageInfoTable, PublicRange } from "../../279map-backend-common/src/types/schema";
import { getUserAuthInfoInTheMap, loadUserAuthInfo } from "../auth/getMapUser";
import { Auth, MapListItem } from "../graphql/__generated__/types";
import { Request } from 'express';
import { compareAuth } from "../util/utility";

/**
 * ユーザがアクセス可能な地図一覧を返す
 * @param userId 
 * @returns 
 */
export async function getMapList(req: Request): Promise<MapListItem[]> {
    const con = await ConnectionPool.getConnection();

    const mapList = [] as MapListItem[];

    await loadUserAuthInfo(req);
    try {
        // 地図一覧取得
        const selectQuery = 'select * from map_page_info';
        const [rows] = await con.execute(selectQuery, [PublicRange.Public]);
        const records = rows as MapPageInfoTable[];

        for (const record of records) {
            const authInfo = await getUserAuthInfoInTheMap(record, req);

            // 権限のあるもののみ返す
            const authLv = function() {
                if ('guestAuthLv' in authInfo) {
                    // ゲスト権限の場合は、公開されているもののみ返却対象
                    if (record.public_range === PublicRange.Public) {
                        return authInfo.guestAuthLv;
                    } else {
                        return Auth.None;
                    }
                } else {
                    return authInfo.authLv;
                }
            }();
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.headers['x-forwarded-host'] || req.get('host');
            const domain = `${protocol}://${host}/`;
            const imageUrl = `${domain}mapimage/${record.map_page_id}`;

            req.hostname + req.protocol + req.originalUrl
            if (compareAuth(authLv, Auth.View) >= 0) {
                mapList.push({
                    mapId: record.map_page_id,
                    authLv,
                    name: record.title,
                    description: record.description,
                    thumbnail: record.thumbnail ? imageUrl : undefined,
                })
            }
        }
        
        return mapList;

    } finally {
        con.release();
    }

}