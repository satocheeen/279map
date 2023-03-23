import randomColor from "randomcolor";
import { ConnectionPool } from "..";
import { CurrentMap, schema } from "279map-backend-common";
import { GetCategoryResult } from "../../279map-api-interface/src";
import { CategoryDefine } from "279map-backend-common";

/**
 * get the categories which are used in current map.
 * don't consider about map kind.
 * @param param0 
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
        const sql = `
            select c.* from contents c 
            inner join data_source ds on ds.data_source_id = c.data_source_id
            where category <> '[]' and ds.map_page_id = ?
        `;

        const [rows] = await con.execute(sql, [mapPageId]);
        const categoryMap = new Map<string, CategoryDefine>();
        (rows as schema.ContentsTable[]).forEach((row) => {
            const categories = JSON.parse(row.category as string) as string[];
            categories.forEach(category => {
                if (categoryMap.has(category)) {
                    categoryMap.get(category)?.content_ids.push(row.content_page_id);
                } else {
                    const def = {
                        name: category,
                        color: '',
                        content_ids: [row.content_page_id],
                    } as CategoryDefine;
                    categoryMap.set(category, def);
                }
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