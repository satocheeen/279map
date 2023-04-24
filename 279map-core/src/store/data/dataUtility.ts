import { GetContentsAPI, GetContentsParam } from "tsunagumap-api";
import { ContentsDefine, DataId } from "../../279map-common";
import { ServerInfo } from "../../types/types";
import { getAPICallerInstance } from "../../api/ApiCaller";

export function getMapKey(id: DataId): string {
    return id.id + '___' + id.dataSourceId;
}
// TODO: featureが属するLayerから判断するようにした方が安全
export function convertDataIdFromFeatureId(id: string): DataId {
    const s = id.split('___');
    return {
        id: s[0],
        dataSourceId: s[1],
    }
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