import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AuthManagementInterface, MapInfo } from "../../279map-backend-common/src";
import { Auth, User } from "../graphql/__generated__/types";

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
    async requestForEnterMap(param: {userId: string; mapId: string; name: string; newUserAuthLevel: Auth}): Promise<void> {
        return;
    }

    getUserList(mapId: string): Promise<User[]> {
        throw new Error("Method not implemented.");
    }

    updateUserAuth(param: { mapId: string; userId: string; authLv: Auth; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
}