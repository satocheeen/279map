import { getLogger } from 'log4js';
import { ConnectionPool } from '.';
import { PoolConnection } from 'mysql2/promise';
import { CurrentMap } from '../279map-backend-common/src';
import { ContentsTable, ItemContentLink, ItemsTable, TrackGeoJsonTable, TracksTable } from '../279map-backend-common/src/types/schema';
import { QueryGetItemsArgs, ItemDefine, MapKind, FeatureType } from './graphql/__generated__/types';
import { ItemContentInfo } from './api/getItem';

const apiLogger = getLogger('api');

export async function getItems({ param, currentMap }: {param:QueryGetItemsArgs; currentMap: CurrentMap}): Promise<ItemDefine[]> {
    if (!currentMap) {
        throw 'no currentMap';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;
    if (!mapPageId || !mapKind) {
        throw 'no currentMap';
    }

    const items = await getItemsSub(currentMap, param);

    if (param.excludeItemIds) {
        // 除外対象のアイテムを除く
        return items.filter(item => !param.excludeItemIds?.includes(item.id.id))
    } else {
        return items;
    }
}
export async function getItemsSub(currentMap: CurrentMap, param: QueryGetItemsArgs): Promise<ItemDefine[]> {
    const con = await ConnectionPool.getConnection();
    
    try {
        const pointContents = await selectItems(con, param, currentMap);

        if (currentMap.mapKind === MapKind.Virtual) {
            return pointContents;
        }

        // 軌跡コンテンツ
        const trackContents = await selectTrackInArea(con, param, currentMap.mapId);
        const contents = pointContents.concat(...trackContents);

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

async function selectItems(con: PoolConnection, param: QueryGetItemsArgs, currentMap: CurrentMap): Promise<ItemDefine[]> {
    try {
        // 位置コンテンツ
        let sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson
        from items i
        inner join data_source ds on ds.data_source_id = i.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
        where map_page_id = ? and i.map_kind = ? and i.data_source_id = ?
        and ST_Intersects(location, ST_GeomFromText(?,4326))
        `;
        const params = [currentMap.mapId, currentMap.mapKind, param.datasourceId, param.wkt];
        if (param.latestEditedTime) {
            sql += ' and i.last_edited_time > ?';
            params.push(param.latestEditedTime);
        }
        const [rows] = await con.execute(sql, params);
        const pointContents = [] as ItemDefine[];
        for(const row of rows as (ItemsTable & {geojson: any})[]) {
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
                hasContents: contents.length > 0,
                hasImageContentId: getImageContentId(contents),
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
async function selectTrackInArea(con: PoolConnection, param: QueryGetItemsArgs, mapPageId: string): Promise<ItemDefine[]> {
    try {
        const wkt = param.wkt;// getExtentWkt(param.extent);
        const sql = `
                    SELECT tg.track_file_id, tg.sub_id, tg.min_zoom, tg.max_zoom, ST_AsGeoJSON(geojson) as geojson, t.*  FROM track_geojson tg
                    inner join track_files tf on tf.track_file_id = tg.track_file_id 
                    inner join tracks t on t.track_page_id = tf.track_page_id 
                    inner join data_source ds on ds.data_source_id = t.data_source_id 
                    inner join map_datasource_link mdl on mdl.data_source_id = ds.data_source_id 
                    WHERE map_page_id= ? AND MBRIntersects(geojson, GeomFromText(?,4326)) AND min_zoom <= ? AND ? < max_zoom AND t.data_source_id = ?`;
        const [rows] = await con.execute(sql, [mapPageId, wkt, param.zoom, param.zoom, param.datasourceId]);
        
        const list = [] as ItemDefine[];
        for (const row of (rows as (TrackGeoJsonTable & TracksTable)[])) {
            list.push({
                id: {
                    id: '' + row.track_file_id + row.sub_id,
                    dataSourceId: row.data_source_id,
                },
                geoJson: row.geojson,
                geoProperties: {
                    featureType: FeatureType.Track,
                    minZoom: row.min_zoom,
                    maxZoom: row.max_zoom,
                },
                name: '',
                hasContents: false,
                hasImageContentId: [],
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
export async function  getContentsInfo(con: PoolConnection, contentPageId: string): Promise<ItemContentInfo|null> {
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

/**
 * ItemContentInfo配列内に存在する画像を持つコンテンツIDを返す
 * @param contents 
 * @returns 
 */
export function getImageContentId(contents: ItemContentInfo[]) {
    const getDescendant = (contents: ItemContentInfo[]): ItemContentInfo[] => {
        const list: ItemContentInfo[] = [];
        for (const content of contents) {
            const descendant = getDescendant(content.children);
            Array.prototype.push.apply(list, [content, ...descendant]);
        }
        return list;
    }
    const allContent = getDescendant(contents);
    return allContent.filter(c => c.hasImage).map(c => c.id);
}
