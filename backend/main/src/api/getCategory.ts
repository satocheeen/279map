import randomColor from "randomcolor";
import { APIFunc, ConnectionPool } from "..";
import { api } from "279map-common";
import { ContentsTable } from "279map-backend-common/dist/types/schema";
import { CategoryDefine } from "279map-common";

export const getCategory: APIFunc<void, api.GetCategoryResult> = async({ currentMap }) => {
    if (!currentMap) {
        throw 'mapPageId or mapKind not defined.';
    }
    const mapPageId = currentMap.mapPageId;
    const mapKind = currentMap.mapKind;

    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
            select c.*, i.item_page_id from contents c 
            inner join items i ON i.content_page_id = c.content_page_id  
            inner join contents_db_info cdi ON i.contents_db_id = cdi.contents_db_id 
            where category <> '[]' and cdi.map_page_id = ? and i.map_kind = ?
        `;

        const [rows] = await con.execute(sql, [mapPageId, mapKind]);
        const categoryMap = new Map<string, CategoryDefine>();
        (rows as (ContentsTable & {item_page_id: string})[]).forEach((row) => {
            const categories = JSON.parse(row.category as string) as string[];
            categories.forEach(category => {
                if (categoryMap.has(category)) {
                    categoryMap.get(category)?.contents.push({
                        content_id: row.content_page_id,
                        item_id: row.item_page_id,
                    });
                } else {
                    const def = {
                        name: category,
                        color: '',
                        contents: [{
                            content_id: row.content_page_id,
                            item_id: row.item_page_id,
                        }],
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