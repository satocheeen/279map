import { ConnectionPool } from ".";
import { getLogger } from "log4js";
import { CurrentMap, DataSourceTable } from "../279map-backend-common/src";
import { EventContent, EventDefine, QueryGetEventArgs } from "./graphql/__generated__/types";
import { QueryResolverReturnType } from "./graphql/type_utility";
import { DatasourceLocationKindType, MapKind } from "./types-common/common-types";
import { ContentsTable } from "../279map-backend-common/dist";

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
                    id: v.data_id,
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
    data_id: string;
}
/**
 * 指定の地図上のdateを保持するコンテンツ一覧を返す
 * @param currentMap 地図
 * @param dataSourceIds 指定されている場合は、このデータソースのコンテンツに限定する
 */
async function getAllDates(currentMap: CurrentMap, dataSourceIds?: string[]): Promise<DateResult[]> {
    if (dataSourceIds && dataSourceIds.length === 0) return [];

    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const sql = `
        select c.date, c.data_id, ds.data_source_id from contents c 
        inner join data_link dl on dl.to_data_id = c.data_id 
        inner join datas d on dl.from_data_id = d.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where date is not NULL
        `;
    
        const locationKinds = currentMap.mapKind === MapKind.Real ? [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track] : [DatasourceLocationKindType.VirtualItem];
        const query = con.format(sql, [currentMap.mapId, locationKinds]);
        const [rows] = await con.execute(query);

        const records = (rows as (ContentsTable & DataSourceTable)[]).map((rec): DateResult => {
            return {
                data_id: rec.data_id + '',
                data_source_id: rec.data_source_id,
                date: rec.date as string,
            }
        });

        if (!dataSourceIds) {
            return records
        } else {
            return records.filter(row => dataSourceIds.includes(row.data_source_id));
        }
    
    } catch(e) {
        logger.warn('get dates failed.', e);
        await con.rollback();
        throw new Error('get dates failed');

    } finally {
        con.release();
    }
}