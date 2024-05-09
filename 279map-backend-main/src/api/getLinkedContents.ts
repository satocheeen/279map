import { DataId } from "../../279map-backend-common/dist";
import { Auth, CurrentMap } from "../../279map-backend-common/src";
import { ContentsDefine } from "../graphql/__generated__/types";

type Param = {
    dataId: DataId;
    currentMap: CurrentMap;
    authLv: Auth;
}

/**
 * 指定のdataIdに紐づくコンテンツを返す
 * @param dataId 基点となるdataId
 * @param mapId 接続中の地図ID。この地図で使われていないコンテンツは返さない。
 * @param authLv ユーザ認証レベル。この値を加味して、コンテンツのeditable等を設定して返す。
 * @return 指定のdataIdに紐づくコンテンツ一覧。指定のdataId自体のコンテンツは含まない。
 */
export async function getLinkedContent({ dataId, currentMap, authLv }: Param): Promise<ContentsDefine[]> {
    return [];
}