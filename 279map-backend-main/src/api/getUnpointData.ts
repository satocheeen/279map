import { CurrentMap, ItemContentDefine, MapKind, schema } from "279map-backend-common";
import { ConnectionPool } from "..";

/**
 * ODBAのGetUnpontDataAPIを呼び出す前のチェック処理
 */
/**
 * 現在の地図上に紐づけ可能なデータソースか確認
 * @param currentMap 
 * @param dataSourceId 
 * @returns 
 */
export async function checkLinkableDatasource(currentMap: CurrentMap, dataSourceId: string): Promise<boolean> {
    const targetDatasources = await getLinkableDataSources(currentMap, dataSourceId);
    return targetDatasources.some(ds => dataSourceId === ds.data_source_id);
}
/**
 * 現在の地図で、指定のデータソースコンテンツを紐づけ可能にしているデータソース一覧を返す
 * @param currentMap 
 * @param dataSourceId 
 */
async function getLinkableDataSources(currentMap: CurrentMap, dataSourceId: string): Promise<schema.DataSourceTable[]> {
    const con = await ConnectionPool.getConnection();

    try {
        // 地図で使われているデータソースを取得
        const sql = `
            SELECT ds.* FROM data_source ds 
            INNER JOIN map_datasource_link mdl ON ds.data_source_id = mdl.data_source_id  
            WHERE mdl.map_page_id = ?
            `;
        const [rows] = await con.query(sql, [currentMap.mapId]);

        // 指定のデータソースを紐づけ可能にしているデータソースに絞る
        return (rows as schema.DataSourceTable[]).filter(row => {
            if ((row.item_contents as ItemContentDefine).Content?.linkableContents.some(lc => lc.contentDatasourceId === dataSourceId)) {
                return true;
            }
            if (currentMap.mapKind === MapKind.Real) {
                if ((row.item_contents as ItemContentDefine).RealItem?.linkableContents.some(lc => lc.contentDatasourceId === dataSourceId)) {
                    return true;
                }
                if ((row.item_contents as ItemContentDefine).Track?.linkableContents.some(lc => lc.contentDatasourceId === dataSourceId)) {
                    return true;
                }
                return false;
            } else {
                if ((row.item_contents as ItemContentDefine).VirtualItem?.linkableContents.some(lc => lc.contentDatasourceId === dataSourceId)) {
                    return true;
                }
            }
        })

    } finally {
        await con.commit();
        con.release();
    }

}