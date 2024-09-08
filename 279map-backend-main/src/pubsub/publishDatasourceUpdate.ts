import { ConnectionPool, PubSub } from "..";
import { DataSourceTable, MapDataSourceLinkTable } from "../../279map-backend-common/src";
import { getMapInfo } from "../getMapInfo";
import { DatasourceLocationKindType, MapKind } from "../types-common/common-types";

/**
 * 指定のデータソースが更新されたことによって影響を受ける対象に
 * pubsub通知を送る
 * @param datasourceId 
 */
export async function publishDatasourceUpdate(datasourceId: string) {
    // データソースを参照している地図を取得
    const targets = await getTargetMap(datasourceId);

    for (const target of targets) {
        const result = await getMapInfo(
            target.mapId,
            target.mapKind,
        );
    
        PubSub.publish('datasourceUpdateInTheMap',
            { mapId: target.mapId, mapKind: target.mapKind },
            {
                contentDataSources: result.contentDataSources,
                itemDataSources: result.itemDataSources,
            }
        )
    }

}

type Target = {
    mapId: string;
    mapKind: MapKind;
}
async function getTargetMap(datasourceId: string): Promise<Target[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from data_source ds 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where ds.data_source_id = ?
        `;
        const [rows] = await con.query(sql, [datasourceId]);
        const records = rows as (MapDataSourceLinkTable & DataSourceTable)[];
        return records.map(rec => {
            return {
                mapId: rec.map_page_id,
                mapKind: rec.location_kind === DatasourceLocationKindType.VirtualItem ? MapKind.Virtual : MapKind.Real
            }
        })

    } finally {
        con.release();
    }
}