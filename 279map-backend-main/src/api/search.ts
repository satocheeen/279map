import { DataId } from "279map-backend-common";
import { CurrentMap, schema } from '279map-backend-common';
import { SearchParam, SearchResult } from "../../279map-api-interface/src";
import { ConnectionPool } from "..";
import { PoolConnection } from "mysql2/promise";

export async function search(currentMap: CurrentMap, param: SearchParam): Promise<SearchResult> {
    // 将来、ANDやOR検索になる可能性があるので、この階層でトランザクション管理している
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        let hitList: DataId[] = [];
        let firstFlag = true;
        for (const condition of param.conditions) {
            let searchResult: DataId[];
            switch(condition.type) {
                case 'category':
                    searchResult = await searchByCategory(con, currentMap, condition.category, param.dataSourceIds);
                    break;
                case 'calendar':
                    searchResult = await searchByDate(con, currentMap, condition.date, param.dataSourceIds);
                    break;
                case 'keyword':
                    searchResult = await searchByKeyword(con, currentMap, condition.keyword, param.dataSourceIds);
                    break;
            }
            if (firstFlag) {
                firstFlag = false;
                hitList = searchResult;
                continue;
            }
            // ANDで絞る
            hitList = filterArrayByAND(hitList, searchResult, (a, b) => a.id === b.id && a.dataSourceId === b.dataSourceId);
        }
        return {
            contents: hitList,
        }
    
    } finally {
        await con.commit();
        con.release();
    }
}

function filterArrayByAND<T>(arr1: T[], arr2: T[], isEqual: (a: T, b: T) => boolean) {
    return arr1.filter(obj1 => arr2.some(obj2 => isEqual(obj1, obj2)));
}

/**
 * 指定のカテゴリを持つコンテンツを返す
 * @param con 
 * @param category 
 */
async function searchByCategory(con: PoolConnection, currentMap: CurrentMap, category: string, dataSourceIds?: string[]): Promise<DataId[]> {

    const sql = `
    select c.* from contents c
    where exists (
        select icl.* from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
        where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
        and mdl.map_page_id = ? and i.map_kind = ?
        and JSON_CONTAINS(c.category, ?) > 0
    )
    `;
    const categoryParam = `["${category}"]`;
    const [rows] = await con.execute(sql, [currentMap.mapId, currentMap.mapKind, categoryParam]);
    return (rows as schema.ContentsTable[]).map((row): DataId => {
        return {
            dataSourceId: row.data_source_id,
            id: row.content_page_id,
        };
    });
}

/**
 * 指定の日付のコンテンツを返す
 * @param con 
 * @param currentMap 
 * @param date 
 */
async function searchByDate(con: PoolConnection, currentMap: CurrentMap, date: string, dataSourceIds?: string[]): Promise<DataId[]> {
    const sql = `
    select c.* from contents c
    where exists (
        select icl.* from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
        where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
        and mdl.map_page_id = ? and i.map_kind = ?
        and DATE_FORMAT(date,'%Y-%m-%d') = ?
    )
    `;

    const [rows] = await con.execute(sql, [currentMap.mapId, currentMap.mapKind, date]);
    return (rows as schema.ContentsTable[]).map((row): DataId => {
        return {
            dataSourceId: row.data_source_id,
            id: row.content_page_id,
        };
    });

}

/**
 * 指定のキーワードを持つコンテンツを返す
 * @param con 
 * @param currentMap 
 * @param keyword 
 */
async function searchByKeyword(con: PoolConnection, currentMap: CurrentMap, keyword: string, dataSourceIds?: string[]): Promise<DataId[]> {
    const sql = `
    select c.* from contents c
    where exists (
        select icl.* from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
        where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
            and mdl.map_page_id = ? and i.map_kind = ?
        and (JSON_SEARCH(c.contents, 'one', ?) is not null or c.title like ?)
        ${dataSourceIds ? 'and c.data_source_id in (?)' : ''}
    )
    `;

    const keywordParam = `%${keyword}%`;
    const params = [currentMap.mapId, currentMap.mapKind, keywordParam, keywordParam] as any[];
    if (dataSourceIds) {
        params.push(dataSourceIds);
    }
    const query = con.format(sql, params);

    const [rows] = await con.execute(query);
    return (rows as schema.ContentsTable[]).map((row): DataId => {
        return {
            dataSourceId: row.data_source_id,
            id: row.content_page_id,
        };
    });

}