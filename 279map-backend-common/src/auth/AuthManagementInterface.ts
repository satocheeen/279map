import { Auth } from "279map-common";
import { NextFunction, Request, Response } from 'express';

export type MapInfo = {
    auth_lv: Auth;
    name: string;
}

export abstract class AuthManagementInterface {
    abstract initialize(): Promise<void>;

    abstract checkJwt(req: Request, res: Response, next: NextFunction): void;
    
    /**
     * 指定のユーザがユーザ登録している地図一覧を返す
     * @param userId 
     * @returns 地図id一覧
     */
    abstract getUserMapList(userId: string): Promise<string[]>;

    /**
     * 指定のユーザの指定の地図での権限情報を返す
     * @param userId 
     * @param mapId 
     * @return ユーザ情報。該当するデータが存在しない場合、null。
     */
    abstract getUserInfoOfTheMap(userId: string, mapId: string): Promise<MapInfo|undefined>;

    /**
     * 指定の地図に対して、指定のユーザを登録申請する
     * @param userId 
     * @param mapId
     */
    abstract requestForEnterMap(userId: string, mapId: string): Promise<void>;

}