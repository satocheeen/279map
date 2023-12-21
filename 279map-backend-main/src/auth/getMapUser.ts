import { authManagementClient } from "..";
import { AuthMethod, MapPageOptions } from '279map-common';
import { getLogger } from 'log4js';
import { authMethod } from '..';
import { Request } from 'express';
import { MapPageInfoTable, PublicRange } from "../../279map-backend-common/src/types/schema";
import { Auth } from "../graphql/__generated__/types";

const apiLogger = getLogger('api');

export const getUserIdByRequest = (req: Request): string | undefined => {
    if (authMethod === AuthMethod.None) {
        return;

    } else if (authMethod === AuthMethod.Auth0) {
        if (!req.auth) {
            return;
        }
        return req.auth.payload.sub;

    } else {
        return req.headers.authorization?.replace('Bearer ', '');
    }
}

export type UserAuthInfo = {
    userId?: string;
} & ({
    authLv: Auth.Request | Auth.None | undefined;   // undefined=未ログイン、None=ログインしているがユーザ登録されていない
    guestAuthLv: Auth;
} | {
    authLv: Auth.Admin | Auth.Edit | Auth.View;
    userName: string;
});

// ユーザ権限情報
const userAuthInfoMap = {} as {[userId: string]: UserAuthInfo};

/**
 * 指定の地図へのユーザアクセス権限情報を返す
 * @param mapPageInfo 地図テーブルレコード
 * @param req リクエスト情報
 * @param resetAuthInfo trueの場合、認証情報を再取得する。falseの場合、メモリから取得する。
 * @returns アクセス権限情報。ログインが必要な地図で、ユーザが未ログインの場合はundfined。
 */
export async function getUserAuthInfoInTheMap(mapPageInfo: MapPageInfoTable, req: Request, resetAuthInfo?: boolean): Promise<UserAuthInfo> {
    const guestUserAuth = function() {
        const auth = (mapPageInfo.options as MapPageOptions | undefined)?.guestUserAuthLevel ?? Auth.None;
        if (auth === Auth.None && mapPageInfo.public_range === PublicRange.Public) {
            // 地図の公開範囲publicの場合は、最低でもView権限
            return Auth.View;
        } else {
            return auth;
        }
    }();
    
    const userId = getUserIdByRequest(req);
    if (!userId) {
        // 未ログインの場合、ゲストユーザ権限を返す
        apiLogger.debug('未ログイン');
        return {
            authLv: undefined,
            guestAuthLv: guestUserAuth,
        }
    }

    apiLogger.debug('ログイン済み');
    // ユーザの地図に対する権限を取得
    const authInfo = await async function(): Promise<UserAuthInfo> {
        if (!resetAuthInfo) {
            const savedAuthInfo = userAuthInfoMap[userId];
            if (savedAuthInfo) return savedAuthInfo;
        }

        apiLogger.debug('認証情報取得');
        const mapUserInfo = await authManagementClient.getUserInfoOfTheMap(userId, mapPageInfo.map_page_id);
        if (mapUserInfo) {
            switch(mapUserInfo.auth_lv) {
                case Auth.None:
                case Auth.Request:
                    return {
                        userId,
                        authLv: mapUserInfo.auth_lv,
                        guestAuthLv: guestUserAuth,
                    }
                default:
                    return {
                        userId,
                        authLv: mapUserInfo.auth_lv as Auth.Admin | Auth.Edit | Auth.View,
                        userName: mapUserInfo.name,
                    };
                }
        } else {
            // ユーザが権限を持たない場合
            return {
                userId,
                authLv: Auth.None,
                guestAuthLv: guestUserAuth,
            }
        }
    }();

    // 保管する
    userAuthInfoMap[userId] = authInfo;

    return authInfo;
}
