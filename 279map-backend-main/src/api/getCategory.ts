import randomColor from "randomcolor";
import { ConnectionPool } from "..";
import { CurrentMap, DataSourceTable, DatasourceLocationKindType, MapDataSourceLinkTable } from "../../279map-backend-common/src";
import { getLogger } from "log4js";
import { CategoryDefine, QueryGetCategoryArgs } from "../graphql/__generated__/types";
import { QueryResolverReturnType } from "../graphql/type_utility";

const apiLogger = getLogger('api');

/**
 * get the categories which are used in current map.
 * @param currentMap 
 * @returns categories
 */
export async function getCategory(param: QueryGetCategoryArgs, currentMap: CurrentMap): QueryResolverReturnType<'getCategory'> {
    if (!currentMap) {
        throw 'mapPageId or mapKind not defined.';
    }

    const con = await ConnectionPool.getConnection();

    try {
        // 指定の地図で使用されているデータソース内のカテゴリ項目一覧を取得
        const categoryFields = await getCategoriFields(currentMap);

        // TODO: 指定のデータソースのものに絞る？


        // コンテンツで使用されているカテゴリを取得
        const result: CategoryDefine[] = [];
        for (const field of categoryFields) {
            for (const fieldKey of field.categoryFieldKeyList) {
                const values = await getCategoryValuesOfTheField(field.datasourceId, fieldKey);
                // 色設定
                const colors = randomColor({
                    seed: 0,
                    count: values.length,
                    format: 'rgb',
                });

                result.push({
                    datasourceId: field.datasourceId,
                    fieldKey,
                    categories: values.map((val, index) => {
                        return {
                            name: val,
                            color: colors[index],
                        }
                    })
                })
            }
        }

        return result;
        
    } catch(e) {
        throw 'getCategory error' + e;
        
    } finally {
        await con.rollback();
        con.release();
    }
}

type CategoryFieldsInDatasource = {
    datasourceId: string;
    categoryFieldKeyList: string[];
}

/**
 * 指定の地図で使用されているデータソース内のカテゴリ項目一覧を取得
 * @param currentMap 
 * @returns 指定の地図で使用されているデータソース単位のカテゴリ項目のキー一覧
 */
async function getCategoriFields(currentMap: CurrentMap): Promise<CategoryFieldsInDatasource[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from map_datasource_link mdl 
        inner join data_source ds on mdl.data_source_id = ds.data_source_id 
        where map_page_id = ?
        order by mdl .order_num
        `;
    
        const query = con.format(sql, [currentMap.mapId]);
        const [rows] = await con.execute(query);

        const result: CategoryFieldsInDatasource[] = [];
        (rows as (MapDataSourceLinkTable & DataSourceTable)[]).forEach(row => {
            if (!('contentFieldKeyList' in row.mdl_config)) return;
            const categoryFields = row.mdl_config.contentFieldKeyList.filter(cfKey => {
                const contentDef = row.contents_define?.find(def => def.key === cfKey);
                return contentDef?.type === 'category';
            });
            result.push({
                datasourceId: row.data_source_id,
                categoryFieldKeyList: categoryFields,
            })
        })
        return result;

    } catch(e) {
        apiLogger.warn('getCategoriFields failed.', e);
        throw new Error('getCategoriFields failed');

    } finally {
        con.release();
    }
}

/**
 * 指定のデータソースの指定のフィールドで使用されているカテゴリ値の一覧を取得して返す
 * @param datasourceId 
 * @param fieldKey 
 */
async function getCategoryValuesOfTheField(datasourceId: string, fieldKey: string): Promise<string[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from (
            select JSON_EXTRACT(c.contents , '$.${fieldKey}') as mycategory
            from contents c
            inner join datas d on d.data_id = c.data_id 
            where d.data_source_id = ?
        ) as c2
        where c2.mycategory is not null
        `;
    
        const query = con.format(sql, [datasourceId]);
        const [rows] = await con.execute(query);

        const resultSet = new Set<string>();
        (rows as {mycategory: string[]}[]).forEach(row => {
            row.mycategory.forEach(category => {
                resultSet.add(category);
            });
        })

        return Array.from(resultSet);

    } catch(e) {
        apiLogger.warn('getCategoryValuesOfTheField failed.', e);
        throw new Error('getCategoryValuesOfTheField failed');

    } finally {
        con.release();
    }

}

type CategoryResult = {
    data_source_id: string;
    category: string[] | null;
}

async function getAllCategories(currentMap: CurrentMap, dataSourceIds?: string[]): Promise<CategoryResult[]> {
    if (dataSourceIds && dataSourceIds.length === 0) return [];
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        select distinct d2.data_source_id, c2.category from contents c2
        inner join datas d2 on d2.data_id = c2.data_id 
        inner join map_datasource_link mdl2 on mdl2.data_source_id = d2.data_source_id 
        where mdl2.map_page_id = ?
        union
        -- この地図上のアイテムから参照されているコンテンツ
        select distinct d.data_source_id, c.category from contents c 
        inner join data_link dl on dl.to_data_id = c.data_id 
        inner join datas d on dl.from_data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where mdl.map_page_id = ?
        `;
    
        const query = con.format(sql, [currentMap.mapId, currentMap.mapId]);
        const [rows] = await con.execute(query);

        if(!dataSourceIds) {
            return (rows as CategoryResult[]);
        } else {
            return (rows as CategoryResult[]).filter(res => dataSourceIds.includes(res.data_source_id));
        }
    
    } catch(e) {
        apiLogger.warn('get dates failed.', e);
        throw new Error('get dates failed');

    } finally {
        con.release();
    }
}