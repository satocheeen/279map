import { ConnectionPool } from '.';
import { getLogger } from 'log4js';
import { MapPageInfoTable } from '../279map-backend-common/src/types/schema';
import { getUserAuthInfoInTheMap, loadUserAuthInfo } from './auth/getMapUser';
import { Request } from 'express';
import { Auth, ConnectErrorType } from '../279map-backend-common/src';
import { CustomError } from './graphql/CustomError';

const apiLogger = getLogger('api');

/**
 * 指定の地図の情報を返す
 * @param mapId 
 * @param request 
 * @return 地図情報とユーザ権限情報。地図が存在しない場合またはアクセス権限がない場合は、エラースロー
 */
export async function getMapInfoByIdWithAuth (mapId: string, request: Request) {
    const mapInfo = await getMapInfoById(mapId);
    if (mapInfo === null) {
        throw new CustomError({
            type: ConnectErrorType.UndefinedMap,
            message: 'mapId is not found : ' + mapId,
        });
    }

    await loadUserAuthInfo(request);
    const userAccessInfo = await getUserAuthInfoInTheMap(mapInfo, request);
    if (userAccessInfo.authLv === undefined && userAccessInfo.guestAuthLv === Auth.None) {
        // ログインが必要な地図の場合
        throw new CustomError({
            type: ConnectErrorType.Unauthorized,
            message: 'need login',
        });
    }

    if (userAccessInfo.authLv === Auth.None && userAccessInfo.guestAuthLv === Auth.None) {
        // 権限なし
        throw new CustomError({
            type: ConnectErrorType.NoAuthenticate,
            message: 'this user does not have authentication' + userAccessInfo.userId,
            userId: userAccessInfo.userId,
        })
    }
    if (userAccessInfo.authLv === Auth.Request && userAccessInfo.guestAuthLv === Auth.None) {
        // 承認待ち
        throw new CustomError({
            type: ConnectErrorType.Requesting,
            message: 'requesting',
            userId: userAccessInfo.userId,
        })
    }

    return {
        mapInfo,
        userAccessInfo,
    }
}

/**
 * 指定のidに該当する地図情報を返す。
 * @param mapId 地図ID。該当するものが存在しない場合は、null。
 */
export async function getMapInfoById(mapId: string): Promise<MapPageInfoTable|null> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'SELECT * FROM map_page_info WHERE map_page_id = ?';
        const [rows] = await con.execute(sql, [mapId]);
        const records = rows as MapPageInfoTable[];
        if (records.length === 0) {
            return null;
        }
        return records[0];

    } catch(e) {
        apiLogger.warn('get map_page_id failed.', mapId, e);
        return null;

    } finally {
        await con.rollback();
        con.release();

    }
}
