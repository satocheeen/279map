import { ContentBelongMapView, CurrentMap, DatasourceLocationKindType, MapKind } from "../../279map-backend-common/src";
import { ConnectionPool } from "..";
import { PoolConnection } from "mysql2/promise";
import { CategoryCondition, DateCondition, QuerySearchArgs } from "../graphql/__generated__/types";
import { DataId } from "../types-common/common-types";
import { ContentsTable, DataLinkTable } from "../../279map-backend-common/dist";
import dayjs from "dayjs";

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
 * @param condition 
 */
async function searchByCategory(con: PoolConnection, currentMap: CurrentMap, condition: CategoryCondition, dataSourceIds?: string[]): Promise<HitContent[]> {

    const sql = `
    select c.*, cbm.* from contents c 
    inner join content_belong_map cbm on cbm.content_id = c.data_id 
    where JSON_CONTAINS(c.contents, ?, ?)
    and cbm.map_page_id = ? and cbm.location_kind in (?) ${dataSourceIds ? 'and cbm.item_datasource_id in (?)' : ''}
    `;
    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const param = [`["${condition.value}"]`, `$.${condition.fieldKey}`, currentMap.mapId, dsKind] as any[];
    const query = con.format(sql, dataSourceIds ? [...param, dataSourceIds] : param);
    const [rows] = await con.execute(query);
    const records = rows as (ContentsTable & ContentBelongMapView)[]; 

    return records.map((row): HitContent => {
        return {
            contentId: row.content_id,
            itemId: row.item_id,
        };
    });
}

/**
 * 指定の日付のコンテンツを返す
 * @param con 
 * @param currentMap 
 * @param date 
 */
async function searchByDate(con: PoolConnection, currentMap: CurrentMap, date: DateCondition, dataSourceIds?: string[]): Promise<HitContent[]> {
    const offsetStr = formatTimezoneOffset(date.utcOffset);
    const startDate = dayjs(date.date).format('YYYY-MM-DD');
    const endDate = dayjs(date.date).add(1, 'day').format('YYYY-MM-DD');

    const sql = `
    select c.*, cbm.* from contents c 
    inner join content_belong_map cbm on cbm.content_id = c.data_id 
    where CONVERT_TZ(date, '+00:00', ?) BETWEEN ? AND ?
    and cbm.map_page_id = ? and cbm.location_kind in (?) ${dataSourceIds ? 'and cbm.item_datasource_id in (?)' : ''}
    `;

    const dsKind = currentMap.mapKind === MapKind.Virtual ? DatasourceLocationKindType.VirtualItem : DatasourceLocationKindType.RealItem;
    const params = [offsetStr, startDate, endDate, currentMap.mapId, dsKind] as any[];
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
    select c.*, cbm.* from contents c 
    inner join content_belong_map cbm on cbm.content_id = c.data_id 
    where JSON_SEARCH(c.contents, 'one', ?) is not null
    and cbm.map_page_id = ? and cbm.location_kind in (?) ${dataSourceIds ? 'and cbm.item_datasource_id in (?)' : ''}
    `;

    const keywordParam = `%${keyword}%`;
    const dsKind = currentMap.mapKind === MapKind.Virtual ? [DatasourceLocationKindType.VirtualItem] : [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track];
    const params = [keywordParam, currentMap.mapId, dsKind] as any[];
    if (dataSourceIds) {
        params.push(dataSourceIds);
    }
    const query = con.format(sql, params);

    const [rows] = await con.execute(query);
    const records = rows as (ContentsTable & ContentBelongMapView)[]; 

    return records.map((row): HitContent => {
        return {
            contentId: row.content_id,
            itemId: row.item_id,
        };
    });

}

/**
 * UTCオフセット値(分)を、'+09:00'の形式の文字列に変換する
 * @param {number} utcOffsetMinutes - UTCオフセット値(分)
 * @returns {string} タイムゾーンオフセットの文字列表記 (例: '+09:00')
 */
function formatTimezoneOffset(utcOffsetMinutes: number) {
    const absoluteOffsetMinutes = Math.abs(utcOffsetMinutes);
    const hourOffset = Math.floor(absoluteOffsetMinutes / 60);
    const minuteOffset = absoluteOffsetMinutes % 60;
    const offsetHours = String(hourOffset).padStart(2, '0');
    const offsetMinutes = String(minuteOffset).padStart(2, '0');
    const sign = utcOffsetMinutes < 0 ? '-' : '+';
    return `${sign}${offsetHours}:${offsetMinutes}`;
}