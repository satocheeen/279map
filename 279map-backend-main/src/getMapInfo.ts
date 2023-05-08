import { schema } from '279map-backend-common';
import { ConnectionPool } from '.';
import { MapKind } from '279map-backend-common';
import { DataSourceInfo, GetMapInfoParam, GetMapInfoResult, SourceKind } from '../279map-api-interface/src';
import mysql from 'mysql2/promise';

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
    const dataSources = await getDataSources(mapPageInfo.map_page_id, targetMapKind);

    return {
        mapKind: targetMapKind,
        extent,
        dataSources,
    }

}

/**
 * 指定の地図データページIDの情報を取得する
 * @param pageId Notion地図データページID または Alias
 */
export async function getMapPageInfo(pageId: string): Promise<schema.MapPageInfoTable | null> {
    const con = await ConnectionPool.getConnection();

    try {
        const [rows] = await con.execute('SELECT * FROM map_page_info WHERE map_page_id=?', [pageId]);
        if ((rows as schema.MapPageInfoTable[]).length === 0) {
            return null;
        }
        const record = (rows as schema.MapPageInfoTable[])[0];
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
 * 指定の地図で使用されているデータソース一覧を返す
 * @param mapId 
 * @param mapKind 
 */
async function getDataSources(mapId: string, mapKind: MapKind): Promise<DataSourceInfo[]> {
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const sql = `select * from data_source ds
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id =?`;
        // execute引数でパラメタを渡すと、なぜかエラーになるので、クエリを作成してから投げている
        const query = mysql.format(sql, [mapId]);
        const [rows] = await con.execute(query);

        const dataSources = (rows as schema.DataSourceTable[]).filter(record => {
            return (record.kinds as schema.DataSourceKind[]).some(kind => {
                if (mapKind === MapKind.Real) {
                    switch(kind.type) {
                        case schema.DataSourceKindType.RealItem:
                        case schema.DataSourceKindType.RealTrack:
                        case schema.DataSourceKindType.Content:
                            return true;
                        default:
                            return false;
                    }
                } else {
                    switch(kind.type) {
                        case schema.DataSourceKindType.VirtualItem:
                        case schema.DataSourceKindType.Content:
                            return true;
                        default:
                            return false;
                    }
                }
            })
        }).reduce((acc, row) => {
            const kinds = (row.kinds as schema.DataSourceKind[]).filter(kind => {
                if (mapKind === MapKind.Real) {
                    switch(kind.type) {
                        case schema.DataSourceKindType.Content:
                        case schema.DataSourceKindType.RealItem:
                        case schema.DataSourceKindType.RealTrack:
                            return true;
                        default:
                            return false;
                    }
                } else {
                    switch(kind.type) {
                        case schema.DataSourceKindType.Content:
                        case schema.DataSourceKindType.VirtualItem:
                            return true;
                        default:
                            return false;
                    }
                }
            }).map((kind): DataSourceInfo['kinds'][0] => {
                const sourceKind = function() {
                    switch(kind.type) {
                        case schema.DataSourceKindType.Content:
                            return SourceKind.Content;
                        case schema.DataSourceKindType.RealItem:
                        case schema.DataSourceKindType.VirtualItem:
                            return SourceKind.Item;
                        case schema.DataSourceKindType.RealTrack:
                            return SourceKind.Track;
                    }
                }();

                return {
                    type: sourceKind,
                    linkableContent: kind.linkable_content,
                }
            })

            acc.push({
                dataSourceId: row.data_source_id,
                name: row.name,
                readonly: row.readonly,
                kinds,
            });

            return acc;
        }, [] as DataSourceInfo[]);

        return dataSources;

    } finally {
        await con.commit();
        con.release();
    }

}