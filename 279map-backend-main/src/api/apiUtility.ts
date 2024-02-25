import { ConnectionPool } from "..";
import { schema } from "../../279map-backend-common/src";
import { DatasourceKindType, MapKind } from "../graphql/__generated__/types";
import { DataId } from "../types-common/common-types";

type Result = {
    mapId: string;
    mapKind: MapKind;
    itemId: DataId;
}
/**
 * 指定のコンテンツがリンクしているアイテムID一覧を返す
 * @param contentId 
 */
export async function getLinkedItemIdList(contentId: DataId): Promise<Result[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id  and i.data_source_id = icl.item_datasource_id 
        inner join data_sources ds on ds.data_source_id = i.data_source_id
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id
        where icl.content_page_id = ? and icl.content_datasource_id = ?
        `;
        const [rows] = await con.execute(sql, [contentId.id, contentId.dataSourceId]);
        return (rows as (schema.ItemContentLink & schema.ItemsTable & schema.DataSourceTable & schema.MapDataSourceLinkTable)[]).map(row => {
            return {
                mapId: row.map_page_id,
                mapKind: row.kind === DatasourceKindType.VirtualItem ? MapKind.Virtual : MapKind.Real,
                itemId: {
                    id: row.item_page_id,
                    dataSourceId: row.item_datasource_id,
                }
            }
        })

    } finally {
        await con.rollback();
        con.release();
    }
}