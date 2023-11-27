import { Auth } from "279map-common";
import { Resolvers } from "./type_utility";

type AuthLvDefine = Record<Resolvers, Auth>

export const authDefine: AuthLvDefine = {
    getCategory: Auth.View,
    getEvent: Auth.View,
    getItems: Auth.View,
    getContent: Auth.View,
    getContents: Auth.View,
    getContentsInItem: Auth.View,
    getUnpointContents: Auth.Edit,

    removeItem: Auth.Edit,

    registContent: Auth.Edit,
    updateContent: Auth.Edit,
    linkContent: Auth.Edit,
    unlinkContent: Auth.Edit,
    removeContent: Auth.Edit,

    // 管理者機能
    getUserList: Auth.Admin,
    changeAuthLevel: Auth.Admin,
    getLinkableContentsDatasources: Auth.Admin,
}
