import { NextFunction, Request, Response } from 'express';
import axios from "axios";
import { ManagementClient } from 'auth0';
import { auth } from "express-oauth2-jwt-bearer";
import { getLogger } from 'log4js';
import { AuthManagementInterface, UserAuthData } from '../../279map-backend-common/src';
import { Auth, User } from '../graphql/__generated__/types';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { jwtDecode } from "jwt-decode";

const domain = process.env.AUTH0_DOMAIN ?? '';
const client_id = process.env.AUTH0_BACKEND_CLIENT_ID ?? '';
const client_secret = process.env.AUTH0_BACKEND_CLIENT_SECRET ?? '';
const audience = `https://${domain}/api/v2/`;

export type MapInfo = {
    auth_lv: Auth;
    name: string;
}
type AppMetaData = UserAuthData;

const apiLogger = getLogger('api');
const savedTokenPath = process.env.AUTH0_SAVED_TOKEN_PATH;

export class Auth0Management extends AuthManagementInterface {
    #management: ManagementClient | undefined;

    /**
     * トークンを取得する。
     * @returns 
     */
    async #getToekn() {
        // 以前取得したものがファイル保存されているならば、それを取得する
        if (savedTokenPath && existsSync(savedTokenPath)) {
            const token = await readFileSync(savedTokenPath, 'utf-8');
            if (token.length > 0) {
                // 有効期限確認
                const decoded = jwtDecode(token);
                // 有効期限がない場合は、そのtokenを使う
                if (!decoded.exp) return token;

                if (decoded.exp * 1000 > new Date().valueOf() + 30 * 60 * 1000) {
                    // 有効期限まで30分以上あるなら、そのまま使う
                    return token;
                }
            }
        }
        apiLogger.info('get new Auth0 Token for Management API');
        const res = await axios({
            method: 'POST',
            url: `https://${domain}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            data: {
                client_id: client_id,
                client_secret: client_secret,
                audience: audience,
                grant_type: 'client_credentials',
            },
        });
        const token = res.data.access_token;
        if (savedTokenPath) {
            try {
                writeFileSync(savedTokenPath, token, 'utf-8');
            } catch(e) {
                apiLogger.warn('failed save token to file', savedTokenPath);
            }
        }
        return token;
    }

    public async initialize() {
        // token取得
        const token = await this.#getToekn();
        this.#management = new ManagementClient({
            token,
            domain,
        });

        // tokenの有効期限切れが近づいたら、token再取得するためのチェック処理を定期実行
        setInterval(async() => {
            apiLogger.info('check if Auth0 Token is expired');
            const currentToken = await this.#management?.getAccessToken();
            if (!currentToken) return;

            const decoded = jwtDecode(currentToken);
            if (!decoded.exp) return;
            if (decoded.exp * 1000 > new Date().valueOf() + 30 * 60 * 1000) {
                return;
            }
            // 期限切れ30分を切っていたら、トークン再取得
            const token = await this.#getToekn();
            this.#management = new ManagementClient({
                token,
                domain,
            });

        }, 10 * 60 * 1000);
    }

    checkJwt(req: Request, res: Response, next: NextFunction): void {
        if (!req.headers.authorization) {
            // authorizationを持っていない場合は、public地図については参照可能なので、そのまま通す。
            next();
            return;
        }
        auth({
            audience: process.env.AUTH0_AUDIENCE,
            issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
        })(req, res, next);
    }

    /**
     * 指定のユーザがユーザ登録している地図一覧を返す
     * @param userId 
     * @returns 地図id一覧
     */
    public async getUserMapList(userId: string): Promise<string[]> {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const res = await this.#management.getUser({id: userId});
        if (!res.app_metadata) {
            return [];
        }
        const metadata = res.app_metadata as AppMetaData;
        return Object.keys(metadata.maps);
    }

    /**
     * 指定のユーザの指定の地図での権限情報を返す
     * @param userId 
     * @return ユーザ情報。該当するデータが存在しない場合、null。
     */
    public async getUserInfo(userId: string): Promise<UserAuthData> {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const res = await this.#management.getUser({id: userId});
        if (!res.app_metadata) {
            return {
                maps: {},
            };
        }
        const metadata = res.app_metadata as AppMetaData;
        return metadata;
    }

    /**
     * 指定の地図に対して、指定のユーザを登録申請する
     * @param userId 
     * @param mapId
     */
    public async requestForEnterMap(param: {userId: string; mapId: string; name: string; newUserAuthLevel: Auth}) {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const mapId = param.mapId;
        const name = param.name;
        const resUser = await this.#management.getUser({id: param.userId});
        const metadata: AppMetaData = (resUser.app_metadata as AppMetaData) ?? { maps: {} };
        // 現在の権限を確認
        if (metadata.maps[mapId]) {
            if (metadata.maps[mapId].auth_lv !== Auth.None) {
                // 既に権限ついているので、何もしない
                apiLogger.warn('the user already has authentication.', param.userId, mapId);
                return;
            }
        }

        // リクエスト状態にする
        metadata.maps[mapId] = {
            auth_lv: param.newUserAuthLevel,
            name,
        };
        await this.#management.updateAppMetadata({
            id: param.userId,
        }, metadata);
    }

    /**
     * 指定の地図のユーザ一覧を返す
     * @param mapId 
     */
    public async getUserList(mapId: string): Promise<User[]> {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const users = await this.#management.getUsers();
        return users.filter(u => {
            const metadata: AppMetaData = (u.app_metadata as AppMetaData) ?? { maps: {} };
            return metadata.maps[mapId] !== undefined;
        }).map((u): User => {
            const metadata: AppMetaData = (u.app_metadata as AppMetaData) ?? { maps: {} };
            return {
                id: u.user_id ?? '',
                authLv: metadata.maps[mapId].auth_lv,
                name: metadata.maps[mapId].name,
            }
        });
    }

    /**
     * 指定のユーザの権限を更新する
     * @param param 
     */
    public async updateUserAuth(param: {mapId: string; userId: string; authLv: Auth}) {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const userId = param.userId;
        const mapId = param.mapId;
        const resUser = await this.#management.getUser({id: userId});
        const metadata: AppMetaData = (resUser.app_metadata as AppMetaData) ?? { maps: {} };
        metadata.maps[mapId] = {
            auth_lv: param.authLv,
            name: metadata.maps[mapId]?.name ?? '',
        };
        await this.#management.updateAppMetadata({
            id: userId,
        }, metadata);
    }
}