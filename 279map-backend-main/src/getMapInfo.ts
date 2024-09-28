import { ConnectionPool } from '.';
import mysql from 'mysql2/promise';
import { DataSourceTable, MapDataSourceLinkConfig, MapDataSourceLinkTable, MapPageInfoTable } from '../279map-backend-common/src/types/schema';
import { ItemDatasourceInfo, ContentDatasourceInfo, MapInfo, Auth } from './graphql/__generated__/types';
import { ContentFieldDefine, DatasourceLocationKindType, ItemDatasourceConfig, MapKind } from './types-common/common-types';

/**
 * 指定の地図データページ配下のコンテンツ情報を返す
 * @param mapId Notion地図データページID
 */
export async function getMapInfo(mapId: string, mapKind: MapKind): Promise<MapInfo> {
    const mapPageInfo = await getMapPageInfo(mapId);
    if (mapPageInfo === null) {
        // 該当地図が存在しない場合
        throw '地図が存在しません:' + mapId;
    }
    const targetMapKind = mapKind ? mapKind : mapPageInfo.default_map;

    // エクステントを取得
    const extent = await getExtent(mapPageInfo.map_page_id, targetMapKind);

    // DataSourceを取得
    const itemDataSources = await getItemDataSourceGroups(mapPageInfo.map_page_id, targetMapKind);
    const contentDataSources = await getContentDataSources(mapPageInfo.map_page_id, targetMapKind);

    return {
        extent,
        itemDataSources,
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
            select MAX(ST_X(feature)) as max_x, MAX(ST_Y(feature)) as max_y, MIN(ST_X(feature)) as min_x, MIN(ST_Y(feature)) as min_y from geometry_items i
            inner join datas d on d.data_id = i.data_id 
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where map_page_id = ? and ds.location_kind = ?
            `;
            // execute引数でパラメタを渡すと、なぜかエラーになるので、クエリを作成してから投げている
            const dsKind = mapKind === MapKind.Real ? DatasourceLocationKindType.RealItem : DatasourceLocationKindType.VirtualItem;
            const [rows] = await con.execute(sql, [mapPageId, dsKind]);
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
            select MIN(ST_X(ST_PointN(ST_ExteriorRing(ST_Envelope(feature)), 1))) as min_x, MAX(ST_X(ST_PointN(ST_ExteriorRing(ST_Envelope(feature)), 2))) as max_x, MIN(ST_Y(ST_PointN(ST_ExteriorRing(ST_Envelope(feature)), 1))) as min_y, MAX(ST_Y(ST_PointN(ST_ExteriorRing(ST_Envelope(feature)), 3))) as max_y 
            from geometry_items i
            inner join datas d on d.data_id = i.data_id 
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where map_page_id = ? and ds.location_kind in (?)
            `;
            const dsKind = mapKind === MapKind.Real ? [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.StaticImage] : [DatasourceLocationKindType.VirtualItem];
            const query = con.format(sql, [mapPageId, dsKind]);
            const [rows] = await con.execute(query);
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
async function getItemDataSourceGroups(mapId: string, mapKind: MapKind): Promise<ItemDatasourceInfo[]> {
    const con = await ConnectionPool.getConnection();

    try {
        await con.beginTransaction();

        const mapSql = 'select * from map_page_info where map_page_id = ?';
        const [mapRows] = await con.execute(mapSql, [mapId]);
        const mapRecord = (mapRows as MapPageInfoTable[])[0];

        if (!mapRecord) {
            throw new Error('map undefined: ' + mapId);
        }

        const sql = `select * from data_source ds
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id =? and location_kind in (?)
        order by order_num`;
        const locationKinds = mapKind === MapKind.Virtual ? [DatasourceLocationKindType.VirtualItem] : [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track, DatasourceLocationKindType.StaticImage];
        const query = con.format(sql, [mapId, locationKinds]);
        const [rows] = await con.execute(query);

        return (rows as (DataSourceTable & MapDataSourceLinkTable)[]).map((row): ItemDatasourceInfo | undefined => {
            const mdlConfig = row.mdl_config as MapDataSourceLinkConfig;
            if (row.location_kind === DatasourceLocationKindType.None) return;

            const config: ItemDatasourceConfig = row.location_kind === DatasourceLocationKindType.RealItem ? {
                kind: row.location_kind,
                drawableArea: row.location_define?.some(def => def.type === 'geojson') ?? false,
                defaultIcon: mdlConfig.location_kind === DatasourceLocationKindType.RealItem ? mdlConfig.defaultIconKey : undefined,
            } : {
                kind: row.location_kind,
            }
            return {
                datasourceId: row.data_source_id,
                name: row.datasource_name,
                groupName: row.group_name,
                initialVisible: 'initialVisible' in mdlConfig ? mdlConfig.initialVisible ?? true : true,
                config,
            }

        }).filter(item => !!item) as ItemDatasourceInfo[];

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
async function getContentDataSources(mapId: string, mapKind: MapKind): Promise<ContentDatasourceInfo[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `select * from data_source ds
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id =? and contents_define is not null ${mapKind === MapKind.Real ? 'and location_kind <> "VirtualItem"' : ''}
        order by mdl.order_num 
        `;

        const query = mysql.format(sql, [mapId]);
        const [rows] = await con.execute(query);

        return (rows as (DataSourceTable & MapDataSourceLinkTable)[]).map((rec): ContentDatasourceInfo | undefined => {{
            const mdlConfig = rec.mdl_config as MapDataSourceLinkConfig;
            if (rec.location_kind === DatasourceLocationKindType.VirtualItem) {
                return {
                    datasourceId: rec.data_source_id,
                    name: rec.datasource_name,
                    config: {
                        linkableToItem: false,
                        fields: rec.contents_define ?? [],
                    },
                }
            }
            
            return {
                datasourceId: rec.data_source_id,
                name: rec.datasource_name,
                config: {
                    // 世界地図の場合は、Track以外はリンク可能（TrackもTrack側が誤動作しないか確認したらリンク可能にしてよい）。村マップの場合は、VirtualItem以外はリンク可能。
                    linkableToItem: mapKind === MapKind.Real ? rec.location_kind !== DatasourceLocationKindType.Track : true,
                    readonly: rec.config.readonly,
                    fields: 'contentFieldKeyList' in mdlConfig ? mdlConfig.contentFieldKeyList.map((key): ContentFieldDefine | undefined => {
                        const define = rec.contents_define?.find(def => def.key === key);
                        if (!define) return;
                        return define;
                    }).filter(def => !!def) as ContentFieldDefine[] : [],
                },
            }
        }}).filter(row => !!row) as ContentDatasourceInfo[];

    } finally {
        await con.rollback();
        con.release();
    }

}