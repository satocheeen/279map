import { CurrentMap, DatasourceLocationKindType, MapKind } from "../../279map-backend-common/src";
import { ConnectionPool } from "..";
import { PoolConnection } from "mysql2/promise";
import { QuerySearchArgs } from "../graphql/__generated__/types";
import { DataId } from "../types-common/common-types";
import { ContentsTable, DataLinkTable } from "../../279map-backend-common/dist";

export async function search(currentMap: CurrentMap, param: QuerySearchArgs): Promise<DataId[]> {
    if (param.datasourceIds && param.datasourceIds.length === 0) {
        return []
    }

    // 将来、ANDやOR検索になる可能性があるので、この階層でトランザクション管理している
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const hitContents: HitContent[] = [];
        if (param.condition.category) {
            for (const category of param.condition.category) {
                const searchResult = await searchByCategory(con, currentMap, category, param.datasourceIds ?? undefined);
                Array.prototype.push.apply(hitContents, searchResult);
            }
        }
        if (param.condition.date) {
            for (const date of param.condition.date) {
                const searchResult = await searchByDate(con, currentMap, date, param.datasourceIds ?? undefined);
                Array.prototype.push.apply(hitContents, searchResult);
            }
        }
        if (param.condition.keyword) {
            for (const keyword of param.condition.keyword) {
                const searchResult = await searchByKeyword(con, currentMap, keyword, param.datasourceIds ?? undefined);
                Array.prototype.push.apply(hitContents, searchResult);

                // const searchItemResult = await searchItemByKeyword(con, currentMap, keyword, param.datasourceIds ?? undefined);
                // Array.prototype.push.apply(hitItems, searchItemResult);
            }

        }
        // TODO: ANDで絞る
        // hitList = filterArrayByAND(hitList, searchResult, (a, b) => a.contentId.id === b.contentId.id && a.contentId.dataSourceId === b.contentId.dataSourceId);

        const result: DataId[] = [];
        hitContents.forEach(hitRecord => {
            result.push(hitRecord.contentId);
        });

        return result;
    
    } finally {
        await con.commit();
        con.release();
    }
}

function filterArrayByAND<T>(arr1: T[], arr2: T[], isEqual: (a: T, b: T) => boolean) {
    return arr1.filter(obj1 => arr2.some(obj2 => isEqual(obj1, obj2)));
}

type HitContent = {
    contentId: DataId;
    itemId: DataId;
}
/**
 * 指定のカテゴリを持つコンテンツを返す
 * @param con 
 * @param category 
 */
async function searchByCategory(con: PoolConnection, currentMap: CurrentMap, category: string, dataSourceIds?: string[]): Promise<HitContent[]> {

    const sql = `
    select c.*, dl2.* from contents c 
    inner join data_link dl2 on dl2.to_data_id = c.data_id 
    where JSON_CONTAINS(c.category, ?) > 0
    and EXISTS (
        select * from data_link dl 
        inner join datas d on d.data_id = dl.from_data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id and mdl.map_page_id = ?
        where ds.location_kind in (?) ${dataSourceIds ? 'and ds.data_source_id in (?)' : ''}
        and dl.to_data_id = c.data_id 
    )
    `;
    const categoryParam = `["${category}"]`;
    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const param = [categoryParam, currentMap.mapId, dsKind] as any[];
    const query = con.format(sql, dataSourceIds ? [...param, dataSourceIds] : param);
    const [rows] = await con.execute(query);
    const records = rows as (ContentsTable & DataLinkTable)[]; 

    return records.map((row): HitContent => {
        return {
            contentId: row.data_id,
            itemId: row.from_data_id,
        };
    });
}

/**
 * 指定の日付のコンテンツを返す
 * @param con 
 * @param currentMap 
 * @param date 
 */
async function searchByDate(con: PoolConnection, currentMap: CurrentMap, date: string, dataSourceIds?: string[]): Promise<HitContent[]> {
    const sql = `
    select c.*, dl2.* from contents c 
    inner join data_link dl2 on dl2.to_data_id = c.data_id 
    where DATE_FORMAT(c.date,'%Y-%m-%d') = ?
    and EXISTS (
        select * from data_link dl 
        inner join datas d on d.data_id = dl.from_data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id and mdl.map_page_id = ?
        where ds.location_kind in (?) ${dataSourceIds ? 'and ds.data_source_id in (?)' : ''}
        and dl.to_data_id = c.data_id 
    )
    `;

    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const params = [currentMap.mapId, dsKind, date] as any[];
    if (dataSourceIds) {
        params.push(dataSourceIds);
    }
    const query = con.format(sql, params);
    const [rows] = await con.execute(query);
    const records = rows as (ContentsTable & DataLinkTable)[]; 

    return records.map((row): HitContent => {
        return {
            contentId: row.data_id,
            itemId: row.from_data_id,
        };
    });

}

/**
 * 指定のキーワードを持つコンテンツを返す
 * @param con 
 * @param currentMap 
 * @param keyword 
 */
async function searchByKeyword(con: PoolConnection, currentMap: CurrentMap, keyword: string, dataSourceIds?: string[]): Promise<HitContent[]> {

    const sql = `
    select c.*, dl2.* from contents c 
    inner join data_link dl2 on dl2.to_data_id = c.data_id 
    where JSON_SEARCH(c.contents, 'one', ?) is not null
    and EXISTS (
        select * from data_link dl 
        inner join datas d on d.data_id = dl.from_data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id and mdl.map_page_id = ?
        where ds.location_kind in (?) ${dataSourceIds ? 'and ds.data_source_id in (?)' : ''}
        and dl.to_data_id = c.data_id 
    )
    `;

    const keywordParam = `%${keyword}%`;
    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const params = [currentMap.mapId, dsKind, keywordParam, keywordParam] as any[];
    if (dataSourceIds) {
        params.push(dataSourceIds);
    }
    const query = con.format(sql, params);

    const [rows] = await con.execute(query);
    const records = rows as (ContentsTable & DataLinkTable)[]; 

    return records.map((row): HitContent => {
        return {
            contentId: row.data_id,
            itemId: row.from_data_id,
        };
    });

}

// /**
//  * 指定のキーワードを持つアイテムを返す
//  * @param con 
//  * @param currentMap 
//  * @param keyword 
//  */
// async function searchItemByKeyword(con: PoolConnection, currentMap: CurrentMap, keyword: string, dataSourceIds?: string[]): Promise<DataId[]> {
//     const sql = `
//         select * from items i 
//         inner join data_source ds on ds.data_source_id = i.data_source_id
//         inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
//         where mdl.map_page_id = ?
//         and ds.location_kind = ?
//         and name like ?
//         ${dataSourceIds ? 'and i.data_source_id in (?)' : ''}
//     `
//     const keywordParam = `%${keyword}%`;
//     const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
//     const params = [currentMap.mapId, dsKind, keywordParam] as any[];
//     if (dataSourceIds) {
//         params.push(dataSourceIds);
//     }
//     const query = con.format(sql, params);
//     const [rows] = await con.execute(query);
//     return (rows as ItemsTable[]).map((item): DataId => {
//         return {
//             id: item.item_page_id,
//             dataSourceId: item.data_source_id,
//         }
//     })
// }
