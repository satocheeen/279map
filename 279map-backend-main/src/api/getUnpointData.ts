import { ConnectionPool } from "..";
import { CurrentMap } from "../../279map-backend-common/src";
import { DataSourceTable } from "../../279map-backend-common/src/types/schema";
import { ContentConfig, DatasourceConfig, DatasourceKindType, RealPointContentConfig } from "../graphql/__generated__/types";

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
async function getLinkableDataSources(currentMap: CurrentMap, dataSourceId: string): Promise<DataSourceTable[]> {
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
        return (rows as DataSourceTable[]).filter(row => {
            const config = (row.config as DatasourceConfig);
            if (config.kind === DatasourceKindType.Item) {
                return true;
            } else if (config.kind === DatasourceKindType.RealPointContent) {
                return (config as RealPointContentConfig).linkableContents;
            } else if (config.kind === DatasourceKindType.Content) {
                return (config as ContentConfig).linkableChildContents;
            } else {
                return false;
            }
        })

    } finally {
        await con.commit();
        con.release();
    }

}