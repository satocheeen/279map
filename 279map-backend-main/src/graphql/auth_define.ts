import { Auth } from "./__generated__/types";
import { Resolvers } from "./type_utility";

type AuthLvDefine = Record<Resolvers, Auth>

export const authDefine: AuthLvDefine = {
    config: Auth.None,
    getMapList: Auth.None,
    
    connect: Auth.None,
    disconnect: Auth.None,
    switchMapKind: Auth.View,
    
    getCategory: Auth.View,
    getEvent: Auth.View,
    getItems: Auth.View,
    getItemsById: Auth.View,
    getContent: Auth.View,
    getContents: Auth.View,
    getContentsInItem: Auth.View,
    getUnpointContents: Auth.Edit,

    getThumb: Auth.View,
    getImage: Auth.View,
    getImageUrl: Auth.View,
    
    registData: Auth.Edit,
    updateData: Auth.Edit,
    removeData: Auth.Edit,

    updateContent: Auth.Edit,
    linkContent: Auth.Edit,
    unlinkContent: Auth.Edit,

    search: Auth.View,
    geocoder: Auth.View,
    getGeocoderFeature: Auth.View,
    getSnsPreview: Auth.View,

    // 管理者機能
    getUserList: Auth.Admin,
    changeAuthLevel: Auth.Admin,
    request: Auth.None,
    getLinkableContentsDatasources: Auth.Admin,

}
