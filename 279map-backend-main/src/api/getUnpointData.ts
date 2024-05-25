import { ConnectionPool } from "..";
import { ContentsTable } from "../../279map-backend-common/dist";
import { DataSourceTable, DatasTable, OdbaGetUncachedDataParam } from "../../279map-backend-common/src";
import { QueryResolverReturnType } from "../graphql/type_utility";
import { DatasourceLocationKindType, MapKind } from "../types-common/common-types";

export type UnpointContent = Awaited<QueryResolverReturnType<'getUnpointContents'>>['contents'][0];

/**
 * キャッシュDBに存在するデータの中から、指定の地図上のアイテムにプロットされていないデータを取得する
 */
export async function getUnpointData({ currentMap, dataSourceId, keyword }: OdbaGetUncachedDataParam): Promise<UnpointContent[]> {
    const con = await ConnectionPool.getConnection();

    try {
        let sql = `
            select * from datas d3 
            inner join contents c on c.data_id = d3.data_id 
            where not EXISTS (
                -- 対になるitemが指定の地図上に存在するdata
                select d.* from datas d 
                inner join geometry_items gi on gi.data_id = d.data_id 
                inner join data_source ds on ds.data_source_id = d.data_source_id 
                inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
                where mdl.map_page_id = ? and ds.location_kind in (?)
                and d.data_id = d3.data_id 
                UNION 
                -- 指定の地図上に存在するitemから参照されているdata
                select d2.* from datas d2 
                inner join data_link dl on dl.to_data_id = d2.data_id 
                inner join datas from_d on from_d.data_id = dl.from_data_id 
                inner join data_source ds2 on ds2.data_source_id = from_d .data_source_id  
                inner join map_datasource_link mdl2 on mdl2.data_source_id = from_d .data_source_id  
                where mdl2.map_page_id = ? and ds2.location_kind in (?)
                and d2.data_id = d3.data_id 
            )
            and d3.data_source_id = ?        
            `;

        const locationKinds = currentMap.mapKind === MapKind.Real ? [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track] : [DatasourceLocationKindType.VirtualItem];
        const params = [currentMap.mapId, locationKinds, currentMap.mapId, locationKinds, dataSourceId];
        if (keyword) {
            sql += "and JSON_SEARCH(c.contents, 'one', ?) is not null";
            params.push(keyword);

        }
        const query = con.format(sql, params);
        const [rows] = await con.query(query);
        const records = rows as (DatasTable & ContentsTable)[];

        const dsSql = 'select * from data_source where data_source_id = ?';
        const [dsRows] = await con.query(dsSql, [dataSourceId]);
        const datasource = (dsRows as DataSourceTable[])[0];
        const titleDef = datasource.contents_define?.find(def => def.type === 'title');
        const textDefList = datasource.contents_define?.filter(def => def.type === 'string' || def.type === 'text') ?? [];
        const imageDefList = datasource.contents_define?.filter(def => def.type === 'image') ?? [];
        return records.map(record => {
            const title = (titleDef && record.contents) ? record.contents[titleDef.key] : '';
            const overview = record.contents ? textDefList.map(def => record.contents ? record.contents[def.key] as string : '').join('') : undefined;
            const hasImage = imageDefList.some(def => record.contents ? def.key in record.contents : false);
            return {
                dataId: record.data_id,
                originalId: record.original_id,
                title,
                overview,
                hasImage,
            }
        })

    } finally {
        con.release();
    }
}