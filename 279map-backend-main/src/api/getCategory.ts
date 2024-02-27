import randomColor from "randomcolor";
import { ConnectionPool } from "..";
import { CurrentMap } from "../../279map-backend-common/src";
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
        // コンテンツで使用されているカテゴリを取得
        const records = await getAllCategories(currentMap, param.datasourceIds ?? undefined);
        const categoryMap = new Map<string, CategoryDefine>();
        records.forEach((row) => {
            const categories = (JSON.parse(row.category) ?? []) as string[];
            categories.forEach(category => {
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, {
                        name: category,
                        color: '',
                        datasourceIds: []
                    });
                }
                categoryMap.get(category)?.datasourceIds.push(row.data_source_id);
            })
        });

        const categories = Array.from(categoryMap.values());
        // 色設定
        const colors = randomColor({
            seed: 0,
            count: categories.length,
            format: 'rgb',
        });
        categories.forEach((category, index) => {
            category.color = colors[index];
        });

        return categories.map(c => {
            const { datasourceIds, ...atr } = c;
            return {
                datasourceIds,
                ...atr,
            }
        });
        
    } catch(e) {
        throw 'getCategory error' + e;
        
    } finally {
        await con.rollback();
        con.release();
    }
}

type CategoryResult = {
    data_source_id: string;
    category: string;
}

async function getAllCategories(currentMap: CurrentMap, dataSourceIds?: string[]): Promise<CategoryResult[]> {
    if (dataSourceIds && dataSourceIds.length === 0) return [];
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const sql = `
        select distinct c.data_source_id, c.category from contents c
        inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
        inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id
        where category is not null and mdl.map_page_id = ? 
        ${dataSourceIds ? 'and i.data_source_id in (?)' : ''}
        union distinct 
        select distinct icl.item_datasource_id as data_source_id, c.category from contents c 
        inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id
        inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
        where category is not null and mdl.map_page_id = ? 
        ${dataSourceIds ? 'and i.data_source_id in (?)' : ''}
        `;
    
        const params = dataSourceIds ?
                            [currentMap.mapId, dataSourceIds, currentMap.mapId, dataSourceIds]
                             : [currentMap.mapId, currentMap.mapId, currentMap.mapKind];
        const query = con.format(sql, params);
        const [rows] = await con.execute(query);

        await con.commit();

        return (rows as CategoryResult[]);
    
    } catch(e) {
        apiLogger.warn('get dates failed.', e);
        await con.rollback();
        throw new Error('get dates failed');

    } finally {
        con.release();
    }
}