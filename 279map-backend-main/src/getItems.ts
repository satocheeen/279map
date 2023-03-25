import { schema, CurrentMap, getDataSourceKindsFromMapKind, GeoProperties } from '279map-backend-common';
import { ItemContentInfo, ItemDefine, MapKind, FeatureType } from '279map-backend-common';
import { getLogger } from 'log4js';
import { ConnectionPool } from '.';
import { GetItemsParam, GetItemsResult } from '../279map-api-interface/src';
import { getExtentWkt } from './util/utility';
import mysql from 'mysql2/promise';

const apiLogger = getLogger('api');

export async function getItems({ param, currentMap }: {param:GetItemsParam; currentMap: CurrentMap}): Promise<GetItemsResult> {
    if (!currentMap) {
        throw 'no currentMap';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;
    if (!mapPageId || !mapKind) {
        throw 'no currentMap';
    }

    const items = await getItemsSub(mapPageId, mapKind, param);

    return {
        items,
    };
}
export async function getItemsSub(mapPageId: string, mapKind: MapKind, param: GetItemsParam): Promise<ItemDefine[]> {
    const con = await ConnectionPool.getConnection();

    // コンテンツ取得メソッド
    const getContentsInfo = async(contentPageId: string): Promise<ItemContentInfo|null> => {
        const sql = 'select * from contents c where content_page_id = ?';
        const [rows] = await con.execute(sql, [contentPageId]);
        const myRows = rows as schema.ContentsTable[];
        if (myRows.length === 0) {
            apiLogger.warn('not founc content.', contentPageId);
            return null;
        }

        const row = myRows[0];
        const discendant = await getChildrenContentInfo(row.content_page_id);
        return {
            id: row.content_page_id,
            hasImage: row.thumbnail ? true : false,
            children: discendant,
        };
    }
    const getChildrenContentInfo = async(contentPageId: string): Promise<ItemContentInfo[]> => {
        const sql = 'select * from contents c where parent_id = ?';
        const [rows] = await con.execute(sql, [contentPageId]);
        const myRows = rows as schema.ContentsTable[];
        if (myRows.length === 0) {
            return [];
        }
        const children = [] as ItemContentInfo[];
        for(const row of myRows) {
            const discendant = await getChildrenContentInfo(row.content_page_id);
            children.push({
                id: row.content_page_id,
                hasImage: row.thumbnail ? true : false,
                children: discendant,
            });
        }
        return children;
    };
    
    try {
        // 位置コンテンツ
        const kinds = getDataSourceKindsFromMapKind(mapKind, {item: true});
        const sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson
        from items i
        inner join data_source ds on ds.data_source_id = i.data_source_id 
        where map_page_id = ? and ds.kind in (?)
        `;
        const query = mysql.format(sql, [mapPageId, kinds]);
        const [rows] = await con.execute(query);
        // const [rows] = await con.execute(sql, [mapPageId, mapKind]);
        const pointContents = [] as ItemDefine[];
        for(const row of rows as (schema.ItemsTable & {geojson: any})[]) {
            const contents: ItemContentInfo[] = [];
            let lastEditedTime = row.last_edited_time;

            const contentLinkSql = 'select * from item_content_link where item_page_id = ?';
            const [linkRows] = await con.execute(contentLinkSql, [row.item_page_id]);
            const linkRecords = linkRows as schema.ItemContentLink[];
            if (linkRecords.length > 0) {
                // 配下のコンテンツID取得
                for (const linkRecord of linkRecords) {
                    const child = await getContentsInfo(linkRecord.content_page_id);
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

            const geoProperties: GeoProperties = row.geo_properties ? JSON.parse(row.geo_properties)
                                 :
                                    {
                                        featureType: FeatureType.STRUCTURE,
                                    };
            if ('radius' in geoProperties && mapKind === MapKind.Real) {
                geoProperties.featureType = FeatureType.AREA;
            }

            pointContents.push({
                id: row.item_page_id,
                dataSourceId: row.data_source_id,
                name,
                geoJson: row.geojson,
                geoProperties,
                contents,
                lastEditedTime,
            });
        }

        if (mapKind === MapKind.Virtual) {
            return pointContents;
        }

        // 軌跡コンテンツ
        const trackContents = await selectTrackInArea(param, mapPageId);
        const contents = pointContents.concat(...trackContents);

        return contents;

    } finally {
        await con.commit();
        con.release();

    }
    
}

/**
 * 指定のズームLv.、エクステントに該当するトラックGPXを返す
 * @param map_id 
 * @param zoom_lv 
 * @param ext 
 */
async function selectTrackInArea(param: GetItemsParam, mapPageId: string): Promise<ItemDefine[]> {
    const con = await ConnectionPool.getConnection();

    try {
        const wkt = getExtentWkt(param.extent);
        const sql = `
                    SELECT tg.track_file_id, tg.sub_id, tg.min_zoom, tg.max_zoom, ST_AsGeoJSON(geojson) as geojson, t.*  FROM track_geojson tg
                    inner join track_files tf on tf.track_file_id = tg.track_file_id 
                    inner join tracks t on t.track_page_id = tf.track_page_id 
                    inner join data_source ds on ds.data_source_id = t.data_source_id 
                    WHERE map_page_id= ? AND MBRIntersects(geojson, GeomFromText(?,4326)) AND min_zoom <= ? AND ? < max_zoom`;
        const [rows] = await con.execute(sql, [mapPageId, wkt, param.zoom, param.zoom]);
        
        return (rows as (schema.TrackGeoJsonTable & schema.TracksTable)[]).map(row => {
            return {
                id: '' + row.track_file_id + row.sub_id,
                dataSourceId: row.data_source_id,
                geoJson: row.geojson,
                geoProperties: {
                    featureType: FeatureType.TRACK,
                    min_zoom: row.min_zoom,
                    max_zoom: row.max_zoom,
                },
                name: '',
                overview: '',
                category: [],
                contents: [],
                lastEditedTime: row.last_edited_time,
            }
        });
    } finally {
        await con.commit();
        con.release();
    }

}