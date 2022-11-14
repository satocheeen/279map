import { ItemsTable, TrackGeoJsonTable } from '279map-backend-common/dist/types/schema';
import { APIFunc, ConnectionPool } from '.';
import { getExtentWkt } from './util/utility';
import { GetItemsParam, GetItemsResult, ItemDefine } from './types/api';
import { MapKind } from '279map-common/dist/types';

export const getItems: APIFunc<GetItemsParam, GetItemsResult> = async({ currentMap, param }) => {
    if (!currentMap) {
        throw 'no currentMap';
    }
    const mapPageId = currentMap.mapPageId;
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

    // 子孫コンテンツ取得メソッド
    const getDiscendant = async(contentPageId: string): Promise<string[]> => {
        const sql = 'select content_page_id from contents c where parent_id = ?';
        const [rows] = await con.execute(sql, [contentPageId]);
        const myRows = rows as {content_page_id: string}[];
        if (myRows.length === 0) {
            return [];
        }
        const list = [] as string[];
        for (const row of myRows) {
            list.push(row.content_page_id);
            const children = await getDiscendant(row.content_page_id);
            Array.prototype.push.apply(list, children);
        }
        return list;
    }
    
    try {
        // 位置コンテンツ
        const sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson, cdi.map_page_id, c.title 
        from items i
        inner join contents_db_info cdi on i.contents_db_id = cdi.contents_db_id
        left join contents c  on c.content_page_id = i.content_page_id  
        where map_page_id = ? and i.map_kind = ?
        `;
        const [rows] = await con.execute(sql, [mapPageId, mapKind]);
        const pointContents = [] as ItemDefine[];
        for(const row of rows as (ItemsTable & {title?: string; geojson: any})[]) {
            let contentIds: string[] | undefined;
            if (row.content_page_id) {
                // 配下のコンテンツID取得
                contentIds = await getDiscendant(row.content_page_id);
            }

            pointContents.push({
                id: row.item_page_id,
                name: row.title ?? '',
                position: {
                    type: 'geoJson',
                    geoJson: row.geojson,
                },
                geoProperties: row.geo_properties ? JSON.parse(row.geo_properties) : undefined,
                contentId: row.content_page_id,
                discendantContentIds: contentIds,
                lastEditedTime: row.last_edited_time,
            });
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
                    SELECT tg.track_file_id, tg.sub_id, tg.min_zoom, tg.max_zoom, ST_AsGeoJSON(geojson) as geojson, t.last_edited_time  FROM track_geojson tg
                    inner join track_files tf on tf.track_file_id = tg.track_file_id 
                    inner join tracks t on t.track_page_id = tf.track_page_id 
                    inner join contents_db_info cdi on cdi.contents_db_id = t.contents_db_id
                    WHERE map_page_id= ? AND MBRIntersects(geojson, GeomFromText(?,4326)) AND min_zoom <= ? AND ? < max_zoom`;
        const [rows] = await con.execute(sql, [mapPageId, wkt, param.zoom, param.zoom]);
        
        return (rows as (TrackGeoJsonTable & {last_edited_time: string})[]).map(row => {
            return {
                id: '' + row.track_file_id + row.sub_id,
                position: {
                    type: 'track',
                    min_zoom: row.min_zoom,
                    max_zoom: row.max_zoom,
                    geojson: JSON.stringify(row.geojson),
                },
                name: '',
                overview: '',
                category: [],
                contentId: null,
                lastEditedTime: row.last_edited_time,
            }
        });
    } finally {
        await con.commit();
        con.release();
    }

}