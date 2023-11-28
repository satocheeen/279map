import { Auth } from "279map-common";
import { Resolvers } from "./type_utility";

type AuthLvDefine = Record<Resolvers, Auth>

export const authDefine: AuthLvDefine = {
    switchMapKind: Auth.View,
    
    getCategory: Auth.View,
    getEvent: Auth.View,
    getItems: Auth.View,
    getItemsById: Auth.View,
    getContent: Auth.View,
    getContents: Auth.View,
    getContentsInItem: Auth.View,
    getUnpointContents: Auth.Edit,

    updateItem: Auth.Edit,
    removeItem: Auth.Edit,

    registContent: Auth.Edit,
    updateContent: Auth.Edit,
    linkContent: Auth.Edit,
    unlinkContent: Auth.Edit,
    removeContent: Auth.Edit,

    search: Auth.View,

    // 管理者機能
    getUserList: Auth.Admin,
    changeAuthLevel: Auth.Admin,
    getLinkableContentsDatasources: Auth.Admin,
    linkContentsDatasource: Auth.Admin,
    unlinkContentsDatasource: Auth.Admin,
}
