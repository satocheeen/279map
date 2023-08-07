import { FeatureType, ItemContentInfo, ItemDefine, MapKind } from '279map-common';
import { getLogger } from 'log4js';
import { ConnectionPool } from '.';
import { GetItemsParam, GetItemsResult } from '../279map-api-interface/src';
import { checkContaining, getExtentWkt } from './util/utility';
import { SendedExtentInfo } from './session/SessionInfo';
import { PoolConnection } from 'mysql2/promise';
import { CurrentMap } from '../279map-backend-common/src';
import { ContentsTable, ItemContentLink, ItemsTable, TrackGeoJsonTable, TracksTable } from '../279map-backend-common/src/types/schema';

const apiLogger = getLogger('api');

export async function getItems({ param, currentMap, sendedExtent }: {param:GetItemsParam; currentMap: CurrentMap; sendedExtent: SendedExtentInfo}): Promise<GetItemsResult> {
    if (!currentMap) {
        throw 'no currentMap';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;
    if (!mapPageId || !mapKind) {
        throw 'no currentMap';
    }

    const items = await getItemsSub(currentMap, param, sendedExtent);

    return {
        items,
    };
}
export async function getItemsSub(currentMap: CurrentMap, param: GetItemsParam, sendedExtent: SendedExtentInfo): Promise<ItemDefine[]> {
    const con = await ConnectionPool.getConnection();
    
    try {
        // 既に送信済みのExtentかチェック。ItemはZoomレベル関係ない。
        const dataSourceIds = param.dataSourceIds?.filter(dataSourceId => {
            const dsSendedExtent = sendedExtent[dataSourceId];
            if (!dsSendedExtent) return true;
            const isSended = Object.values(dsSendedExtent).some(exts => {
                return exts.some(ext => {
                    return checkContaining(ext, param.extent) === 1;
                });
            })
            return !isSended;
        })
        const pointContents = dataSourceIds.length === 0 ? [] : await selectItems(con, dataSourceIds, currentMap);

        if (currentMap.mapKind === MapKind.Virtual) {
            return pointContents;
        }

        // 既に送信済みのExtentかチェック。
        const zoom = Math.floor(param.zoom);
        const targetDataSourceIds = param.dataSourceIds?.filter(dataSourceId => {
            const dsSendedExtent = sendedExtent[dataSourceId];
            if (!dsSendedExtent) return true;
            const isSended = dsSendedExtent[zoom] ? dsSendedExtent[zoom].some(ext => {
                return checkContaining(ext, param.extent) === 1;
            }) : false;
    
            return !isSended;
        })
        // 軌跡コンテンツ
        const trackContents = targetDataSourceIds.length === 0 ? [] : await selectTrackInArea(con, param, currentMap.mapId);
        const contents = pointContents.concat(...trackContents);

        // console.log('isSended', dataSourceIds.length === 0, targetDataSourceIds.length === 0);
        return contents;

    } catch(e){
        apiLogger.warn('getItem failed', e);
        await con.rollback();
        throw new Error('getItem failed');

    } finally {
        await con.commit();
        con.release();

    }
    
}

async function selectItems(con: PoolConnection, dataSourceIds:string[], currentMap: CurrentMap): Promise<ItemDefine[]> {
    try {
        // 位置コンテンツ
        const sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson
        from items i
        inner join data_source ds on ds.data_source_id = i.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id = ? and i.map_kind = ?
        `;
        const [rows] = await con.execute(sql, [currentMap.mapId, currentMap.mapKind]);
        const pointContents = [] as ItemDefine[];
        for(const row of rows as (ItemsTable & {geojson: any})[]) {
            // 指定されているデータソースのもののみに絞る
            if (!dataSourceIds.includes(row.data_source_id)) {
                continue;
            }
            const contents: ItemContentInfo[] = [];
            let lastEditedTime = row.last_edited_time;

            const contentLinkSql = 'select * from item_content_link where item_page_id = ?';
            const [linkRows] = await con.execute(contentLinkSql, [row.item_page_id]);
            const linkRecords = linkRows as ItemContentLink[];
            if (linkRecords.length > 0) {
                // 配下のコンテンツID取得
                for (const linkRecord of linkRecords) {
                    const child = await getContentsInfo(con, linkRecord.content_page_id);
                    if (!child) continue;
                    contents.push(child);
                    // コンテンツリンクの更新日時が新しければ、そちらを更新日時とする
                    if (lastEditedTime.localeCompare(linkRecord.last_edited_time) < 0) {
                        lastEditedTime = linkRecord.last_edited_time;
                    }
                }
            }

            // itemがnameを持つならname。持たないなら、コンテンツtitle.
            const name = row.name ?? '';

            pointContents.push({
                id: {
                    id: row.item_page_id,
                    dataSourceId: row.data_source_id,
                },
                name,
                geoJson: row.geojson,
                geoProperties: row.geo_properties ? JSON.parse(row.geo_properties) : undefined,
                contents,
                lastEditedTime,
            });
        }

        return pointContents;

    } catch(e) {
        apiLogger.warn('selectItems failed', e);
        throw new Error('selected items failed');
    }
}

/**
 * 指定のズームLv.、エクステントに該当するトラックGPXを返す
 * @param map_id 
 * @param zoom_lv 
 * @param ext 
 */
async function selectTrackInArea(con: PoolConnection, param: GetItemsParam, mapPageId: string): Promise<ItemDefine[]> {
    try {
        const wkt = getExtentWkt(param.extent);
        const sql = `
                    SELECT tg.track_file_id, tg.sub_id, tg.min_zoom, tg.max_zoom, ST_AsGeoJSON(geojson) as geojson, t.*  FROM track_geojson tg
                    inner join track_files tf on tf.track_file_id = tg.track_file_id 
                    inner join tracks t on t.track_page_id = tf.track_page_id 
                    inner join data_source ds on ds.data_source_id = t.data_source_id 
                    inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
                    WHERE map_page_id= ? AND MBRIntersects(geojson, GeomFromText(?,4326)) AND min_zoom <= ? AND ? < max_zoom`;
        const [rows] = await con.execute(sql, [mapPageId, wkt, param.zoom, param.zoom]);
        
        const list = [] as ItemDefine[];
        for (const row of (rows as (TrackGeoJsonTable & TracksTable)[])) {
            // データソースが指定されている場合は、指定されているデータソースのもののみに絞る
            if (param.dataSourceIds) {
                if (!param.dataSourceIds.includes(row.data_source_id)) {
                    continue;
                }
            }

            list.push({
                id: {
                    id: '' + row.track_file_id + row.sub_id,
                    dataSourceId: row.data_source_id,
                },
                geoJson: row.geojson,
                geoProperties: {
                    featureType: FeatureType.TRACK,
                    min_zoom: row.min_zoom,
                    max_zoom: row.max_zoom,
                },
                name: '',
                contents: [],
                lastEditedTime: row.last_edited_time,
            })
        }
        return list;
    } catch(e) {
        apiLogger.warn('selectTrackInArea failed', e);
        throw new Error('selectTrackInArea failed');
    }

}

// コンテンツ取得メソッド
async function  getContentsInfo(con: PoolConnection, contentPageId: string): Promise<ItemContentInfo|null> {
    const getChildrenContentInfo = async(contentPageId: string): Promise<ItemContentInfo[]> => {
        const sql = 'select * from contents c where parent_id = ?';
        const [rows] = await con.execute(sql, [contentPageId]);
        const myRows = rows as ContentsTable[];
        if (myRows.length === 0) {
            return [];
        }
        const children = [] as ItemContentInfo[];
        for(const row of myRows) {
            const discendant = await getChildrenContentInfo(row.content_page_id);
            children.push({
                id: {
                    id: row.content_page_id,
                    dataSourceId: row.data_source_id,
                },
                hasImage: row.thumbnail ? true : false,
                children: discendant,
            });
        }
        return children;
    };

    const sql = 'select * from contents c where content_page_id = ?';
    const [rows] = await con.execute(sql, [contentPageId]);
    const myRows = rows as ContentsTable[];
    if (myRows.length === 0) {
        apiLogger.warn('not founc content.', contentPageId);
        return null;
    }

    const row = myRows[0];
    const discendant = await getChildrenContentInfo(row.content_page_id);
    return {
        id: {
            id: row.content_page_id,
            dataSourceId: row.data_source_id,
        },
    hasImage: row.thumbnail ? true : false,
        children: discendant,
    };
}
