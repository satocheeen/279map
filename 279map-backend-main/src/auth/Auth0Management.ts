import { NextFunction, Request, Response } from 'express';
import axios from "axios";
import { ManagementClient } from 'auth0';
import { Auth, AuthManagementInterface  } from "279map-backend-common";
import { auth } from "express-oauth2-jwt-bearer";
import { getLogger } from 'log4js';

const domain = process.env.AUTH0_DOMAIN ?? '';
const client_id = process.env.AUTH0_BACKEND_CLIENT_ID ?? '';
const client_secret = process.env.AUTH0_BACKEND_CLIENT_SECRET ?? '';
const audience = `https://${domain}/api/v2/`;

export type MapInfo = {
    auth_lv: Auth;
    name: string;
}
type AppMetaData = {
    maps: {[mapId: string]: MapInfo}
}
const apiLogger = getLogger('api');
export class Auth0Management extends AuthManagementInterface {
    #management: ManagementClient | undefined;

    public async initialize() {
        // token取得
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

        this.#management = new ManagementClient({
            token,
            domain,
        });
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
     * @param mapId 
     * @return ユーザ情報。該当するデータが存在しない場合、null。
     */
    public async getUserInfoOfTheMap(userId: string, mapId: string): Promise<MapInfo|undefined> {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const res = await this.#management.getUser({id: userId});
        if (!res.app_metadata) {
            return;
        }
        const metadata = res.app_metadata as AppMetaData;
        return metadata.maps[mapId];
    }

    /**
     * 指定の地図に対して、指定のユーザを登録申請する
     * @param userId 
     * @param mapId
     */
    public async requestForEnterMap(userId: string, mapId: string) {
        if (!this.#management) {
            throw new Error('authManagementClient not initialize');
        }
        const resUser = await this.#management.getUser({id: userId});
        const metadata: AppMetaData = (resUser.app_metadata as AppMetaData) ?? { maps: {} };
        // 現在の権限を確認
        if (metadata.maps[mapId]) {
            if (metadata.maps[mapId].auth_lv !== Auth.None) {
                // 既に権限ついているので、何もしない
                apiLogger.warn('the user already has authentication.', userId, mapId);
                return;
            }
        }

        // リクエスト状態にする
        metadata.maps[mapId] = {
            auth_lv: Auth.Request,
            name: '',
        };
        await this.#management.updateAppMetadata({
            id: userId,
        }, metadata);
    }
}