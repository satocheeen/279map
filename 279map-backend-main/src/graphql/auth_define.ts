import { Auth } from "279map-common";
import { Resolvers } from "./type_utility";

type AuthLvDefine = Record<Resolvers, Auth>

export const authDefine: AuthLvDefine = {
    hello: Auth.None,
    getCategory: Auth.View,
    getItems: Auth.View,
    updateContent: Auth.Edit,
}
