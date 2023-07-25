import { AuthManagementInterface, MapInfo } from "../../../279map-backend-common/src/auth/AuthManagementInterface";
import axios, { AxiosResponse } from "axios";
import { Request, Response, NextFunction } from "express";

/**
 * オリジナルの認証サーバーで認証処理を行う場合
 */
export class OriginalAuthManagement extends AuthManagementInterface {
    async initialize() {
        await callOriginalServer('initialize', undefined);
    }

    async checkJwt(req: Request, res: Response, next: NextFunction) {
        try {
            await callOriginalServer('check-jwt', {}, {
                headers: {
                    Authorization: req.headers.authorization,
                }
            });
    
            next();
        } catch(e) {
            // 認証失敗時
            res.status(403).send('illegal Jwt');
        }
    }
    
    async getUserMapList(userId: string): Promise<string[]> {
        const res = await callOriginalServer('get-user-map-list', {
            userId,
        });
        return res;
    }
    async getUserInfoOfTheMap(userId: string, mapId: string): Promise<MapInfo | undefined> {
        const res = await callOriginalServer('get-userinfo-of-map', {
            userId,
            mapId,
        });
        return res;
    }

    requestForEnterMap(userId: string, mapId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}

async function callOriginalServer(api: string, param: any, options?: {headers?: any}) {
    const originalAuthUrl = (process.env.ORIGINAL_AUTH_URL ?? '');
    const url = `${originalAuthUrl}${originalAuthUrl.endsWith('/')?'':'/'}auth/${api}`;
    try {
        let res: AxiosResponse;
        res = await axios.post(url, param, {
            headers: options?.headers,
            timeout: 10000,
        });
        if (res.status !== 200) {
            throw `original auth return errir response: ${res.status} ${res.statusText} ${res.data}`;
        }
        const result = res.data;

        return result;
    
    } catch (e) {
        throw 'connecting server failed:' + url + e;
    }

}