import { authManagementClient } from "..";
import { Auth, AuthMethod, MapPageOptions } from '279map-common';
import { getLogger } from 'log4js';
import { authMethod } from '..';
import { Request } from 'express';
import { MapPageInfoTable, PublicRange } from "../../279map-backend-common/src/types/schema";

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
    userId?: string;
    authLv: Auth;
    userName?: string;
}

/**
 * 指定の地図へのユーザアクセス権限情報を返す
 * @param mapPageInfo 地図テーブルレコード
 * @param req リクエスト情報
 * @returns アクセス権限情報。ログインが必要な地図で、ユーザが未ログインの場合はundfined。
 */
export async function getUserAuthInfoInTheMap(mapPageInfo: MapPageInfoTable, req: Request): Promise<UserAuthInfo|undefined> {
    
    const userId = getUserIdByRequest(req);
    if (!userId) {
        // 未ログインの場合、ゲストユーザ権限を返す
        const guestUserAuth = (mapPageInfo.options as MapPageOptions | undefined)?.guestUserAuthLevel ?? Auth.None;
        if (guestUserAuth === Auth.None) {
            if (mapPageInfo.public_range === PublicRange.Public) {
                // 地図の公開範囲publicの場合は、View権限
                apiLogger.debug('未ログイン-Public');
                return {
                    authLv: Auth.View,
                }
            } else {
                apiLogger.debug('未ログイン-Private');
                return undefined;
            }
        } else {
            return {
                authLv: guestUserAuth,
            }
        }
    }

    apiLogger.debug('ログイン済み');
    // ユーザの地図に対する権限を取得
    const mapUserInfo = await authManagementClient.getUserInfoOfTheMap(userId, mapPageInfo.map_page_id);

    if (mapUserInfo && mapUserInfo.auth_lv !== Auth.None) {
        return {
            userId,
            authLv: mapUserInfo.auth_lv,
            userName: mapUserInfo.name,
        };
    } else {
        // ユーザが権限を持たない場合
        if (mapPageInfo.public_range === PublicRange.Public) {
            // 地図がPublicの場合、View権限
            return {
                userId,
                authLv: Auth.View,
            };
        } else {
            // 地図がprivateの場合、権限なし
            return {
                userId,
                authLv: Auth.None,
            }
        }
    }
}
