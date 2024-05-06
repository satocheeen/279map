import { CurrentMap, DatasourceLocationKindType, MapKind } from "../../279map-backend-common/src";
import { ConnectionPool } from "..";
import { PoolConnection } from "mysql2/promise";
import { ItemContentLink } from "../../279map-backend-common/src/types/schema";
import { QuerySearchArgs, SearchHitItem } from "../graphql/__generated__/types";
import { DataId } from "../types-common/common-types";

export async function search(currentMap: CurrentMap, param: QuerySearchArgs): Promise<SearchHitItem[]> {
    if (param.datasourceIds && param.datasourceIds.length === 0) {
        return []
    }

    // 将来、ANDやOR検索になる可能性があるので、この階層でトランザクション管理している
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const hitContents: HitContent[] = [];
        const hitItems: DataId[] = [];
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

        // item単位でまとめる
        const items: SearchHitItem[] = [];
        hitContents.forEach(hitRecord => {
            const hitItem = items.find(item => item.id === hitRecord.itemId);
            if (hitItem) {
                hitItem.hitContents.push(hitRecord.contentId);
            } else {
                items.push({
                    id: hitRecord.itemId,
                    hitContents: [hitRecord.contentId],
                    hitItem: false,
                });
            }
        });
        hitItems.forEach(itemId => {
            const hitItem = items.find(item=> item.id === itemId);
            if (hitItem) {
                hitItem.hitItem = true;
            } else {
                items.push({
                    id: itemId,
                    hitContents: [],
                    hitItem: true,
                })
            }
        })

        return items;
    
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
    select c.content_page_id, icl.content_datasource_id, icl.item_page_id, icl.item_datasource_id from contents c
    inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
    where exists (
        select icl.* from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
        inner join data_source ds on ds.data_source_id = i.data_source_id
        where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
        and mdl.map_page_id = ?
        and ds.location_kind = ?
        and JSON_CONTAINS(c.category, ?) > 0
        ${dataSourceIds ? 'and i.data_source_id in (?)' : ''}
    )
    `;
    const categoryParam = `["${category}"]`;
    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const params = [currentMap.mapId, dsKind, categoryParam] as any[];
    if (dataSourceIds) {
        params.push(dataSourceIds);
    }
    const query = con.format(sql, params);
    const [rows] = await con.execute(query);
    return (rows as ItemContentLink[]).map((row): HitContent => {
        return {
            contentId: row.content_data_id + '',
            itemId: row.item_data_id + '',
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
    select c.content_page_id, icl.content_datasource_id, icl.item_page_id, icl.item_datasource_id from contents c
    inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
    where exists (
        select icl.* from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
        inner join data_source ds on ds.data_source_id = i.data_source_id
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
        where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
        and mdl.map_page_id = ?
        and ds.location_kind = ?
        and DATE_FORMAT(date,'%Y-%m-%d') = ?
        ${dataSourceIds ? 'and i.data_source_id in (?)' : ''}
    )
    `;

    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const params = [currentMap.mapId, dsKind, date] as any[];
    if (dataSourceIds) {
        params.push(dataSourceIds);
    }
    const query = con.format(sql, params);
    const [rows] = await con.execute(query);

    return (rows as ItemContentLink[]).map((row): HitContent => {
        return {
            contentId: row.content_data_id + '',
            itemId: row.item_data_id + '',
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
    select c.content_page_id, icl.content_datasource_id, icl.item_page_id, icl.item_datasource_id from contents c
    inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
    where exists (
        select icl.* from item_content_link icl 
        inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id 
        inner join data_source ds on ds.data_source_id = i.data_source_id
        inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
        where icl.content_page_id = c.content_page_id and icl.content_datasource_id  = c.data_source_id
            and mdl.map_page_id = ?
            and ds.location_kind = ?
            and (JSON_SEARCH(c.contents, 'one', ?) is not null or c.title like ?)
            ${dataSourceIds ? 'and i.data_source_id in (?)' : ''}
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
    return (rows as ItemContentLink[]).map((row): HitContent => {
        return {
            contentId: row.content_data_id + '',
            itemId: row.item_data_id + '',
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
