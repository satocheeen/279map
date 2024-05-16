import { ConnectionPool } from "..";
import { DataLinkTable, DataSourceTable, MapDataSourceLinkTable } from "../../279map-backend-common/src";
import { MapKind, DatasourceLocationKindType, DataId } from "../types-common/common-types";

type Result = {
    mapId: string;
    mapKind: MapKind;
    itemId: DataId;
    itemDatasourceId: string;
}
/**
 * 指定のデータを参照しているデータID一覧を返す
 * @param id 
 */
export async function getLinkedDataIdList(id: DataId): Promise<Result[]> {
    const con = await ConnectionPool.getConnection();

    // TODO: 要確認
    try {
        const sql = `
        -- 何かのdataを参照しているdataを抽出
        select dl.*, ds.*, mdl.* from datas d 
        inner join data_link dl on dl.from_data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        -- アイテムから参照されているものに絞る
        where EXISTS (
            select * from geometry_items gi 
            where gi.data_id = dl.from_data_id 
        )
        and dl.to_data_id = ?
        `;
        const [rows] = await con.execute(sql, [id]);
        return (rows as (DataLinkTable & DataSourceTable & MapDataSourceLinkTable)[]).map((row): Result => {
            return {
                mapId: row.map_page_id,
                mapKind: row.location_kind === DatasourceLocationKindType.VirtualItem ? MapKind.Virtual : MapKind.Real,
                itemId: row.from_data_id,
                itemDatasourceId: row.data_source_id,
            }
        })

    } finally {
        await con.rollback();
        con.release();
    }
}