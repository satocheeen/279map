import { ConnectionPool } from "..";
import { Auth, types } from '279map-backend-common';
import { getLogger } from 'log4js';
import { authMethod } from '..';
import { Request } from 'express';

const apiLogger = getLogger('api');

export const getUserIdByRequest = (req: Request): string | undefined => {
    if (authMethod === 'None') {
        return;

    } else if (authMethod === 'Auth0') {
        if (!('auth' in req)) {
            return;
        }
        // @ts-ignore
        return req.auth.payload.sub;

    } else {
        // @ts-ignore
        return req.headers.authorization?.replace('Bearer ', '');
    }
}

type UserAuthInfo = {
    authLv: Auth;
    userName?: string;
}

/**
 * 指定の地図へのユーザアクセス権限情報を返す
 * @param mapPageInfo 地図テーブルレコード
 * @param req リクエスト情報
 * @returns アクセス権限情報
 */
export async function getUserAuthInfoInTheMap(mapPageInfo: types.schema.MapPageInfoTable, req: Request): Promise<UserAuthInfo> {
    // const mapDefine = req.connect?.mapPageInfo;
    // if (!req.connect || !mapId || !mapDefine) {
    //     res.status(500).send('Illegal state error');
    //     return;
    // }

    const userId = getUserIdByRequest(req);
    if (!userId) {
        // 未ログイン（地図の公開範囲public）の場合は、View権限
        apiLogger.debug('未ログイン');
        return {
            authLv: Auth.View,
        }
    }

    apiLogger.debug('ログイン済み');
    // ユーザの地図に対する権限を取得
    const mapUserInfo = await getMapUser(mapPageInfo.map_page_id, userId);
    apiLogger.debug('mapUserInfo', mapUserInfo);

    if (mapUserInfo && mapUserInfo.auth_lv !== Auth.None) {
        return {
            authLv: mapUserInfo.auth_lv,
            userName: mapUserInfo.name,
        };
    } else {
        // ユーザが権限を持たない場合
        if (mapPageInfo.public_range === types.schema.PublicRange.Public) {
            // 地図がPublicの場合、View権限
            return {
                authLv: Auth.View,
            };
        } else {
            // 地図がprivateの場合、権限なし
            return {
                authLv: Auth.None,
            }
        }
    }
}

/**
 * 指定の地図のユーザ情報を取得する
 * @param mapId 
 * @param userId 
 * @return ユーザ情報。該当するデータが存在しない場合、null。
 */
export async function getMapUser(mapId: string, userId: string): Promise<types.schema.MapUserTable | null> {
    const con = await ConnectionPool.getConnection();
    
    try {
        const sql = 'SELECT * FROM map_user WHERE map_page_id = ? AND user_id = ?';
        const [rows] = await con.execute(sql, [mapId, userId]);
        const records = (rows as types.schema.MapUserTable[]);

        if (records.length === 0) {
            return null;
        }
        
        return records[0];

    } catch(e) {
        throw new Error('select map_user table failed.');
    } finally {
        await con.rollback();
        con.release();
    }

}