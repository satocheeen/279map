import { getMapPageInfo } from './getMapInfo';
import { MapKind, Auth } from '279map-common';
import { types } from '279map-backend-common';
import { ConnectionPool } from '.';
import { getLogger } from 'log4js';

type Result = {
    mapId: string;
    defaultMapKind: MapKind;
    name: string;
    useMaps: MapKind[];
    authLv: Auth;
    publicRange: types.schema.PublicRange;
}
const apiLogger = getLogger('api');

/**
 * 指定のidまたはaliasに該当する地図IDを返す。
 * @param mapIdOrAlias 地図ID or 地図Alias。該当するものが存在しない場合は、null。
 */
export async function getMapId(mapIdOrAlias: string): Promise<string|null> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'SELECT map_page_id FROM map_page_info WHERE map_page_id = ? OR alias = ?';
        const [rows] = await con.execute(sql, [mapIdOrAlias, mapIdOrAlias]);
        const records = rows as {map_page_id: string}[];
        if (records.length === 0) {
            return null;
        }
        return records[0].map_page_id;

    } catch(e) {
        apiLogger.warn('get map_page_id failed.', mapIdOrAlias, e);
        return null;

    } finally {
        await con.rollback();
        con.release();

    }
}
// /**
//  * 指定の地図データに関する定義情報を返す
//  * @param mapId mapId or mapAlias
//  */
// export async function getMapDefine(mapId: string, auth?: string): Promise<Result> {
//     const mapPageInfo = await getMapPageInfo(mapId);
//     if (mapPageInfo === null) {
//         // 該当地図が存在しない場合
//         throw '地図が存在しません:' + mapId;
//     }
//     // 使用地図を取得
//     const useMaps = mapPageInfo.use_maps.split(',').map(mapKindStr => {
//         return mapKindStr as MapKind;
//     });

//     // 権限判定
//     let authLv = Auth.None;
//     if (mapPageInfo.edit_auth_hash && auth && mapPageInfo.edit_auth_hash === auth) {
//         authLv = Auth.Edit;
//     }
//     console.log('authLv', authLv);
//     return {
//         mapId: mapPageInfo.map_page_id,
//         defaultMapKind: mapPageInfo.default_map,
//         name: mapPageInfo.title,
//         useMaps,
//         authLv,
//         publicRange: mapPageInfo.public_range,
//     }

// }
