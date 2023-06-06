import { GetContentsAPI, GetContentsParam } from "tsunagumap-api";
import { ContentsDefine, DataId } from "279map-common";
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
