import { ConnectionPool, authManagementClient } from "..";
import { getLogger } from 'log4js';
import { authMethod } from '..';
import { Request } from 'express';
import { MapPageInfoTable, PublicRange } from "../../279map-backend-common/src/types/schema";
import { Auth, MapPageOptions } from "../graphql/__generated__/types";
import { AuthMethod } from "../types";

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

type UserAuthInfoByMap = {[mapId: string]: UserAuthInfo};

// ユーザ権限情報
const userAuthInfoMap = {} as {[userId: string]: UserAuthInfoByMap};

/**
 * 指定のリクエストのユーザの最新認証情報をロードする。
 * @param req 
 */
export async function loadUserAuthInfo(req: Request) {
    const userId = getUserIdByRequest(req);
    if (!userId) return;
    const userInfo = await authManagementClient.getUserInfo(userId);

    if (!(userId in userAuthInfoMap)) {
        userAuthInfoMap[userId] = {};
    }

    const con = await ConnectionPool.getConnection();
    try {
        const sql = 'select * from map_page_info';
        const [rows] = await con.execute(sql);

        for (const mapPageInfo of rows as MapPageInfoTable[]) {
            const guestUserAuth = function() {
                const auth = (mapPageInfo.options as MapPageOptions | undefined)?.guestUserAuthLevel ?? Auth.None;
                if (auth === Auth.None && mapPageInfo.public_range === PublicRange.Public) {
                    // 地図の公開範囲publicの場合は、最低でもView権限
                    return Auth.View;
                } else {
                    return auth;
                }
            }();
        
            const authInfo = function(): UserAuthInfo {
                const mapUserInfo = userInfo.maps[mapPageInfo.map_page_id];
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
            userAuthInfoMap[userId][mapPageInfo.map_page_id] = authInfo;

        }

    } finally {
        con.release();
    }


}
/**
 * 指定の地図へのユーザアクセス権限情報を返す
 * @param mapPageInfo 地図テーブルレコード
 * @param req リクエスト情報
 * @param resetAuthInfo trueの場合、認証情報を再取得する。falseの場合、メモリから取得する。
 * @returns アクセス権限情報。ログインが必要な地図で、ユーザが未ログインの場合はundfined。
 */
export async function getUserAuthInfoInTheMap(mapPageInfo: MapPageInfoTable, req: Request): Promise<UserAuthInfo> {
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

    // ユーザの地図に対する権限を取得
    const authInfo = await async function(): Promise<UserAuthInfo> {
        const savedAuthInfo = userAuthInfoMap[userId] ? userAuthInfoMap[userId][mapPageInfo.map_page_id] : undefined;
        if (savedAuthInfo) return savedAuthInfo;

        // ユーザが権限を持たない場合
        return {
            userId,
            authLv: Auth.None,
            guestAuthLv: guestUserAuth,
        }
    }();

    // // 保管する
    // if (!(userId in userAuthInfoMap)) {
    //     userAuthInfoMap[userId] = {};
    // }
    // userAuthInfoMap[userId][mapPageInfo.map_page_id] = authInfo;

    return authInfo;
}
