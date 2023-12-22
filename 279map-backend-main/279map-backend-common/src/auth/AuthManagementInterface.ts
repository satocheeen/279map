import { NextFunction, Request, Response } from 'express';
import { Auth, User } from "../graphql/__generated__/types";

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
     * @param name ユーザ名
     * @param newUserAuthLevel 付与する権限
     */
    abstract requestForEnterMap(param: {userId: string; mapId: string; name: string; newUserAuthLevel: Auth}): Promise<void>;

    /**
     * 指定の地図のユーザ一覧を返す
     * @param mapId 
     */
    abstract getUserList(mapId: string): Promise<User[]>;

    /**
     * 指定のユーザの権限を更新する
     * @param param 
     */
    abstract updateUserAuth(param: {mapId: string; userId: string; authLv: Auth}): Promise<void>;

}