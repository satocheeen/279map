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
            console.log('row.category', row.category)
            const categories = row.category ?? [];
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
    category: string[] | null;
}

async function getAllCategories(currentMap: CurrentMap, dataSourceIds?: string[]): Promise<CategoryResult[]> {
    if (dataSourceIds && dataSourceIds.length === 0) return [];
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const sql = `
        select distinct d.data_source_id, c.category from contents c 
        inner join datas d on d.data_id = c.data_id 
        where EXISTS (
            select * from map_datasource_link mdl 
            where map_page_id = ? and d.data_source_id = mdl.data_source_id 
        )
        `;
    
        const query = con.format(sql, [currentMap.mapId]);
        const [rows] = await con.execute(query);

        await con.commit();

        if(!dataSourceIds) {
            return (rows as CategoryResult[]);
        } else {
            return (rows as CategoryResult[]).filter(res => dataSourceIds.includes(res.data_source_id));
        }
    
    } catch(e) {
        apiLogger.warn('get dates failed.', e);
        await con.rollback();
        throw new Error('get dates failed');

    } finally {
        con.release();
    }
}