import { ConnectionPool } from "..";
import { ContentsTable } from "../../279map-backend-common/dist";
import { CurrentMap, DataSourceTable, DatasTable } from "../../279map-backend-common/src";
import { QueryResolverReturnType } from "../graphql/type_utility";

export type AllocatableContent = Awaited<QueryResolverReturnType<'allocatableContents'>>['contents'][0];

type Param = {
    currentMap: CurrentMap;
    dataSourceId: string;
    keyword?: string;

    // trueを指定した場合、既に建物に割り当て済みのコンテンツも含めて返す
    includeAllocated?: boolean;
}
/**
 * キャッシュDBに存在するデータの中から、指定の地図上のアイテムにプロット可能なデータを取得して返す
 */
export async function getAllocatableContents({ currentMap, dataSourceId, keyword, includeAllocated }: Param): Promise<AllocatableContent[]> {
    const con = await ConnectionPool.getConnection();

    try {
        let sql = `
            select * from datas d
            inner join contents c on c.data_id = d.data_id 
            where d.data_source_id = ?        
            `;

        const params = [dataSourceId];
        if (!includeAllocated) {
            sql += `
            and not EXISTS (
                select * from content_belong_map cbm 
                where cbm.content_id = d.data_id 
                and cbm.map_page_id = ? and cbm.map_kind = ?
            )
            `;
            Array.prototype.push.apply(params, [currentMap.mapId, currentMap.mapKind]);
        }
        if (keyword) {
            sql += "and JSON_SEARCH(c.contents, 'one', ?) is not null";
            const keywordParam = `%${keyword}%`;
            params.push(keywordParam);

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
            const title = (titleDef && record.contents) ? (record.contents[titleDef.key] as string) : '';
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