import { ConnectionPool } from '.';
import { DatasourceConfig, DataSourceGroup, DataSourceInfo, MapKind, MapPageOptions } from '279map-common';
import { GetMapInfoParam, GetMapInfoResult } from '../279map-api-interface/src';
import mysql from 'mysql2/promise';
import { DataSourceTable, MapPageInfoTable } from '../279map-backend-common/src/types/schema';
import { DataSourceKindType } from '279map-common';
import { schema } from '../279map-backend-common/src';

/**
 * 指定の地図データページ配下のコンテンツ情報を返す
 * @param mapId Notion地図データページID
 */
export async function getMapInfo({ param, mapId }: { param: GetMapInfoParam; mapId: string }): Promise<GetMapInfoResult> {
    const mapKind = param.mapKind;
    
    const mapPageInfo = await getMapPageInfo(mapId);
    if (mapPageInfo === null) {
        // 該当地図が存在しない場合
        throw '地図が存在しません:' + mapId;
    }
    const targetMapKind = mapKind ? mapKind : mapPageInfo.default_map;

    // エクステントを取得
    const extent = await getExtent(mapPageInfo.map_page_id, targetMapKind);

    // DataSourceを取得
    const itemDataSourceGroups = await getItemDataSourceGroups(mapPageInfo.map_page_id, targetMapKind);
    const contentDataSources = await getContentDataSources(mapPageInfo.map_page_id);

    return {
        mapKind: targetMapKind,
        extent,
        itemDataSourceGroups,
        contentDataSources,
    }

}

/**
 * 指定の地図データページIDの情報を取得する
 * @param pageId Notion地図データページID または Alias
 */
export async function getMapPageInfo(pageId: string): Promise<MapPageInfoTable | null> {
    const con = await ConnectionPool.getConnection();

    try {
        const [rows] = await con.execute('SELECT * FROM map_page_info WHERE map_page_id=?', [pageId]);
        if ((rows as MapPageInfoTable[]).length === 0) {
            return null;
        }
        const record = (rows as MapPageInfoTable[])[0];
        return record;
    } finally {
        await con.commit();
        con.release();
    }

}

/**
 * 指定の地図データページIDの全コンテンツを含むエクステントを返す
 * @param mapPageId 
 */
async function getExtent(mapPageId: string, mapKind: MapKind): Promise<[number,number,number,number]> {
    const con = await ConnectionPool.getConnection();

    try {
        // 位置コンテンツ
        // -- POINT
        const pointExtent = await async function(){
            const sql = `
            select MAX(ST_X(location)) as max_x, MAX(ST_Y(location)) as max_y, MIN(ST_X(location)) as min_x, MIN(ST_Y(location)) as min_y from items i
            inner join data_source ds on ds.data_source_id = i.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
            where map_page_id = ? and i.map_kind = ? 
            `;
            // execute引数でパラメタを渡すと、なぜかエラーになるので、クエリを作成してから投げている
            const query = mysql.format(sql, [mapPageId, mapKind]);
            const [rows] = await con.execute(query);
            // const [rows] = await con.execute(sql, [mapPageId, kinds]);
            if((rows as any[]).length === 0) {
                throw 'Extent error';
            }
            const record = (rows as any[])[0];
            if (!record.min_y) {
                return undefined;
            }
            const min_y = record.min_y ? record.min_y : 0;
            const min_x = record.min_x ? record.min_x : 0;
            const max_y = record.max_y ? record.max_y : 0;
            const max_x = record.max_x ? record.max_x : 0;
            return { min_x, min_y, max_x, max_y };
        }();

        // -- POLYGON, MULTILINESTRING
        const polygonExtent = await async function() {
            const sql = `
            select MIN(ST_X(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 1))) as min_x, MAX(ST_X(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 2))) as max_x, MIN(ST_Y(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 1))) as min_y, MAX(ST_Y(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 3))) as max_y 
            from items i
            inner join data_source ds on ds.data_source_id = i.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = i.data_source_id 
            where map_page_id = ? and i.map_kind = ? 
            `;
            const query = mysql.format(sql, [mapPageId, mapKind]);
            const [rows] = await con.execute(query);
            // const [rows] = await con.execute(sql, [mapPageId, kinds]);
            if((rows as any[]).length === 0) {
                throw 'Extent error';
            }
            const record = (rows as any[])[0];
            if (!record.min_y) {
                return undefined;
            }
            const min_y = record.min_y ? record.min_y : 0;
            const min_x = record.min_x ? record.min_x : 0;
            const max_y = record.max_y ? record.max_y : 0;
            const max_x = record.max_x ? record.max_x : 0;
            return { min_x, min_y, max_x, max_y };
        }();

        // TODO: 軌跡コンテンツ

        if (pointExtent !== undefined && polygonExtent !== undefined) {
            const min_x = Math.min(pointExtent.min_x, polygonExtent.min_x);
            const min_y = Math.min(pointExtent.min_y, polygonExtent.min_y);
            const max_x = Math.max(pointExtent.max_x, polygonExtent.max_x);
            const max_y = Math.max(pointExtent.max_y, polygonExtent.max_y);
    
            return [min_x, min_y, max_x, max_y];
        }
        if (polygonExtent !== undefined) {
            return [polygonExtent.min_x, polygonExtent.min_y, polygonExtent.max_x, polygonExtent.max_y];
        }
        if (pointExtent !== undefined) {
            return [pointExtent.min_x, pointExtent.min_y, pointExtent.max_x, pointExtent.max_y];
        }
        return [0, 0, 0, 0];

    } finally {
        await con.commit();
        con.release();
    }
}

/**
 * 指定の地図で使用されているアイテムのデータソース一覧を返す
 * @param mapId 
 * @param mapKind 
 */
async function getItemDataSourceGroups(mapId: string, mapKind: MapKind): Promise<DataSourceGroup[]> {
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const mapSql = 'select * from map_page_info where map_page_id = ?';
        const [mapRows] = await con.execute(mapSql, [mapId]);
        const mapRecord = (mapRows as MapPageInfoTable[])[0];

        if (!mapRecord) {
            throw new Error('map undefined: ' + mapId);
        }
        const visibleDataSources = (mapRecord.options as MapPageOptions | undefined)?.visibleDataSources;

        const sql = `select * from data_source ds
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id =?
        order by order_num`;
        // execute引数でパラメタを渡すと、なぜかエラーになるので、クエリを作成してから投げている
        const query = mysql.format(sql, [mapId]);
        const [rows] = await con.execute(query);

        const dataSourceGroupMap = new Map<string, DataSourceInfo[]>();
        (rows as DataSourceTable[]).forEach((row) => {
            const config = row.config as DatasourceConfig;
            if (config.kind === DataSourceKindType.Content) {
                return;
            }
            if (mapKind === MapKind.Virtual && config.kind !== DataSourceKindType.Item) {
                // 村マップの場合は、RealPointContentやTrackは返さない
                return;
            }
            const group = config.layerGroup ?? '';
            if(!dataSourceGroupMap.has(group)) {
                dataSourceGroupMap.set(group, []);
            }
            const visible = !visibleDataSources ? true : visibleDataSources.some(vds => {
                if ('group' in vds) {
                    return vds.group === config.layerGroup;
                } else {
                    return vds.dataSourceId === row.data_source_id;
                }
            });
            const infos = dataSourceGroupMap.get(group) as DataSourceInfo[];
            infos.push(Object.assign({
                dataSourceId: row.data_source_id,
                name: row.name,
                visible,
            }, config));

        });

        const result: DataSourceGroup[] = [];
        for(const entry of dataSourceGroupMap.entries()) {
            const name = entry[0].length === 0 ? undefined : entry[0];
            const dataSources = entry[1];

            const visible = !visibleDataSources ? true : visibleDataSources.some(vds => {
                if ('group' in vds) {
                    return vds.group === name;
                } else {
                    return dataSources.some(ds => ds.dataSourceId === vds.dataSourceId);
                }
            });

            result.push({
                name,
                dataSources,
                visible,
            });
        }

        return result;

    } finally {
        await con.commit();
        con.release();
    }

}

/**
 * 指定の地図で使用されているコンテンツのデータソース一覧を返す
 * @param mapId 
 * @param mapKind 
 */
async function getContentDataSources(mapId: string): Promise<DataSourceInfo[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `select ds.* from data_source ds
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id =? and ds.kind = 'Content'
        order by order_num`;

        const [rows] = await con.execute(sql, [mapId]);
        return (rows as schema.DataSourceTable[]).map((rec): DataSourceInfo => {{
            const config = rec.config as DatasourceConfig;
            return Object.assign({
                dataSourceId: rec.data_source_id,
                name: rec.name,
                visible: true,
            }, config);
        }})

    } finally {
        await con.rollback();
        con.release();
    }

}