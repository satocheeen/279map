import { api, ContentsDefine } from "279map-common";
import { callApi } from "../../api/api";
import { ServerInfo } from "../../types/types";

export async function getContents(mapServer: ServerInfo, param: api.GetContentsParam): Promise<ContentsDefine[]> {
    try {
        // 重複する内容は除去する
        const itemIdSet = new Set<string>();
        const contentIdSet = new Set<string>();
        const fixedParam = param.filter(item => {
            if ('itemId' in item) {
                if (itemIdSet.has(item.itemId)) {
                    return false;
                } else {
                    itemIdSet.add(item.itemId);
                    return true;
                }
            } else {
                if (contentIdSet.has(item.contentId)) {
                    return false;
                } else {
                    contentIdSet.add(item.contentId);
                    return true;
                }
            }
        });
        const apiResult = await callApi(mapServer, api.GetContentsAPI, fixedParam);

        return apiResult.contents;

    } catch (e) {
        console.warn('getContents error', e);
        throw new Error('getContents failed.');
    }

}