import { AuthManagementInterface, MapInfo, User } from "279map-backend-common"
import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export class NoneAuthManagement extends AuthManagementInterface {
    async initialize(): Promise<void> {
    }
    checkJwt(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction): void {
        next();
    }
    async getUserMapList(userId: string): Promise<string[]> {
        return [];
    }
    async getUserInfoOfTheMap(userId: string, mapId: string): Promise<MapInfo | undefined> {
        return;
    }
    async requestForEnterMap(userId: string, param: {mapId: string; name: string}): Promise<void> {
        return;
    }

    getUserList(mapId: string): Promise<User[]> {
        throw new Error("Method not implemented.");
    }
}