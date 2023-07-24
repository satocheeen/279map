import { authManagementClient } from "..";
import { Auth, AuthMethod } from '279map-backend-common';
import { schema } from '279map-backend-common';
import { getLogger } from 'log4js';
import { authMethod } from '..';
import { Request } from 'express';

const apiLogger = getLogger('api');

export const getUserIdByRequest = (req: Request): string | undefined => {
    if (authMethod === AuthMethod.None) {
        return;

    } else if (authMethod === AuthMethod.Auth0) {
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
export async function getUserAuthInfoInTheMap(mapPageInfo: schema.MapPageInfoTable, req: Request): Promise<UserAuthInfo> {
    
    const userId = getUserIdByRequest(req);
    if (!userId) {
        // 未ログインの場合
        if (mapPageInfo.public_range === schema.PublicRange.Public) {
            // 地図の公開範囲publicの場合は、View権限
            apiLogger.debug('未ログイン-Public');
            return {
                authLv: Auth.View,
            }
        } else {
            apiLogger.debug('未ログイン-Private');
            return {
                authLv: Auth.None,
            }
        }
    }

    apiLogger.debug('ログイン済み');
    // ユーザの地図に対する権限を取得
    const mapUserInfo = await authManagementClient.getUserInfoOfTheMap(userId, mapPageInfo.map_page_id);

    if (mapUserInfo && mapUserInfo.auth_lv !== Auth.None) {
        return {
            authLv: mapUserInfo.auth_lv,
            userName: mapUserInfo.name,
        };
    } else {
        // ユーザが権限を持たない場合
        if (mapPageInfo.public_range === schema.PublicRange.Public) {
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
