import { ConnectionPool } from ".";
import { getLogger } from "log4js";
import { CurrentMap } from "../279map-backend-common/src";
import { EventContent, EventDefine, QueryGetEventArgs } from "./graphql/__generated__/types";
import { QueryResolverReturnType } from "./graphql/type_utility";

const logger = getLogger('api');
export async function getEvents(param: QueryGetEventArgs, currentMap: CurrentMap): QueryResolverReturnType<'getEvent'> {
    if (!currentMap) {
        throw 'no currentmap';
    }
    try {
        // get contents which has date in the map
        const records = await getAllDates(currentMap, param.datasourceIds ?? undefined);
        const dataSourceMap = new Map<string, DateResult[]>();
        records.forEach(rec => {
            if (!dataSourceMap.has(rec.data_source_id)) {
                dataSourceMap.set(rec.data_source_id, []);
            }
            dataSourceMap.get(rec.data_source_id)?.push(rec);
        });
        return Array.from(dataSourceMap.entries()).map((entry): EventDefine => {
            const val = entry[1];
            const contents = val.map((v): EventContent => {
                return {
                    id: v.content_data_id,
                    // id: {
                    //     id: v.content_page_id,
                    //     dataSourceId: v.content_datasource_id,
                    // },
                    date: v.date,
                }
            });
            return {
                itemDatasourceId: entry[0],
                contents,
            }
        })

    } catch(e) {
        throw  'getEvents error' + e;

    }
}

type DateResult = {
    data_source_id: string;
    date: string;
    content_data_id: string;
}
/**
 * 指定の地図上のdateを保持するコンテンツ一覧を返す
 * @param currentMap 地図
 * @param dataSourceIds 指定されている場合は、このデータソースのコンテンツに限定する
 */
async function getAllDates(currentMap: CurrentMap, dataSourceIds?: string[]): Promise<DateResult[]> {
    if (dataSourceIds && dataSourceIds.length === 0) return [];

    return [];
    // const con = await ConnectionPool.getConnection();

    // try {
    //     await con.beginTransaction();

    //     const sql = `
    //     select c.data_source_id, DATE_FORMAT(c.date, '%Y-%m-%d') as date, icl.content_page_id, icl.content_datasource_id from contents c
    //     inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
    //     inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
    //     inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id
    //     where date is not null and mdl.map_page_id = ?
    //     ${dataSourceIds ? 'and c.data_source_id in (?)' : ''}
    //     union distinct 
    //     select distinct icl.item_datasource_id as data_source_id, DATE_FORMAT(c.date, '%Y-%m-%d') as date, icl.content_page_id, icl.content_datasource_id from contents c 
    //     inner join item_content_link icl on icl.content_page_id = c.content_page_id and icl.content_datasource_id = c.data_source_id 
    //     inner join items i on i.item_page_id = icl.item_page_id and i.data_source_id = icl.item_datasource_id
    //     inner join map_datasource_link mdl on mdl.data_source_id = c.data_source_id 
    //     where date is not null and mdl.map_page_id = ?
    //     ${dataSourceIds ? 'and icl.item_datasource_id in (?)' : ''}
    //     `;
    
    //     const params = dataSourceIds ?
    //                         [currentMap.mapId, dataSourceIds, currentMap.mapId, dataSourceIds]
    //                          : [currentMap.mapId, currentMap.mapId, currentMap.mapKind];
    //     const query = con.format(sql, params);
    //     const [rows] = await con.execute(query);

    //     await con.commit();

    //     return (rows as DateResult[]);
    
    // } catch(e) {
    //     logger.warn('get dates failed.', e);
    //     await con.rollback();
    //     throw new Error('get dates failed');

    // } finally {
    //     con.release();
    // }
}