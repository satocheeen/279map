import { GetContentsAPI, GetContentsParam } from "tsunagumap-api";
import { ContentsDefine, DataId } from "../../279map-common";
import { ServerInfo } from "../../types/types";
import { getAPICallerInstance } from "../../api/ApiCaller";

export function getMapKey(id: DataId): string {
    return JSON.stringify({
        id: id.id,
        ds: id.dataSourceId
    });
}
export function convertDataIdFromFeatureId(id: string): DataId {
    const json = JSON.parse(id);
    return {
        id: json.id,
        dataSourceId: json.ds,
    };
}

export function isEqualId(id1: DataId, id2: DataId): boolean {
    return id1.id === id2.id && id1.dataSourceId === id2.dataSourceId;
}

export async function getContents(mapServer: ServerInfo, param: GetContentsParam): Promise<ContentsDefine[]> {
    try {
        // 重複する内容は除去する
        const itemIdSet = new Set<string>();
        const contentIdSet = new Set<string>();
        const fixedParam = param.filter(item => {
            if ('itemId' in item) {
                if (itemIdSet.has(getMapKey(item.itemId))) {
                    return false;
                } else {
                    itemIdSet.add(getMapKey(item.itemId));
                    return true;
                }
            } else {
                if (contentIdSet.has(getMapKey(item.contentId))) {
                    return false;
                } else {
                    contentIdSet.add(getMapKey(item.contentId));
                    return true;
                }
            }
        });
        const apiResult = await getAPICallerInstance().callApi(GetContentsAPI, fixedParam);

        return apiResult.contents;

    } catch (e) {
        console.warn('getContents error', e);
        throw new Error('getContents failed.');
    }

}