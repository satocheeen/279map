import randomColor from "randomcolor";
import { ConnectionPool } from "..";
import { CurrentMap, schema } from "279map-backend-common";
import { GetCategoryResult } from "../../279map-api-interface/src";
import { CategoryDefine } from "279map-backend-common";
import { getLogger } from "log4js";

const apiLogger = getLogger('api');

/**
 * get the categories which are used in current map.
 * @param currentMap 
 * @returns categories
 */
export async function getCategory(currentMap: CurrentMap): Promise<GetCategoryResult> {
    if (!currentMap) {
        throw 'mapPageId or mapKind not defined.';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;

    const con = await ConnectionPool.getConnection();

    try {
        // コンテンツで使用されているカテゴリを取得
        const sql = `
            select c.* from contents c 
            inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
            where category is not NULL and mdl.map_page_id = ?
        `;

        const [rows] = await con.execute(sql, [mapPageId]);
        const categoryMap = new Map<string, CategoryDefine>();
        (rows as schema.ContentsTable[]).forEach((row) => {
            const categories = (row.category ?? []) as string[];
            categories.forEach(category => {
                if (categoryMap.has(category)) {
                    categoryMap.get(category)?.content_ids.push({
                        id: row.content_page_id,
                        dataSourceId: row.data_source_id,
                    });
                } else {
                    const def = {
                        name: category,
                        color: '',
                        content_ids: [{
                            id: row.content_page_id,
                            dataSourceId: row.data_source_id,
                        }],
                        using: false,
                    } as CategoryDefine;
                    categoryMap.set(category, def);
                }
            })
        });

        // 指定地図上のアイテムで使われているものを取得
        const itemSql = `
            select c.* from contents c 
            where exists (
                select icl.* from item_content_link icl 
                inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
                inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
                where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
                and category is not NULL 
                and mdl.map_page_id = ? and i.map_kind = ?
            )
        `;
        const [itemSqlRows] = await con.execute(itemSql, [mapPageId, mapKind]);
        (itemSqlRows as schema.ContentsTable[]).forEach((row) => {
            const categories = (row.category ?? []) as string[];
            categories.forEach(category => {
                const target = categoryMap.get(category)
                if (!target) {
                    apiLogger.warn('想定外', category);
                    return;
                }
                target.using = true;
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

        return {
            categories,
        };
        
    } catch(e) {
        throw 'getCategory error' + e;
        
    } finally {
        await con.rollback();
        con.release();
    }
}