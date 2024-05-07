import { DataId } from "../types-common/common-types";

export function getMapKey(id: DataId): number {
    return id;
    // return JSON.stringify({
    //     id: id.id,
    //     ds: id.dataSourceId
    // });
}
export function convertDataIdFromFeatureId(id: number | string | undefined): DataId {
    return Number(id);
    // const json = JSON.parse(id);
    // return {
    //     id: json.id,
    //     dataSourceId: json.ds,
    // };
}

export function isEqualId(id1: DataId, id2: DataId): boolean {
    return id1 === id2;
    // return id1.id === id2.id && id1.dataSourceId === id2.dataSourceId;
}
