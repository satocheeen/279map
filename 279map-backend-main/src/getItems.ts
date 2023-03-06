import { types } from '279map-backend-common';
import { ItemContentInfo, ItemDefine, MapKind } from '279map-common';
import { ConnectionPool } from '.';
import { GetItemsParam, GetItemsResult } from '../279map-api-interface/src';
import { getExtentWkt } from './util/utility';

export async function getItems({ param, currentMap }: {param:GetItemsParam; currentMap: types.CurrentMap}): Promise<GetItemsResult> {
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

    // 子孫コンテンツ取得メソッド
    const getChildrenContentInfo = async(contentPageId: string): Promise<ItemContentInfo[]> => {
        const sql = 'select * from contents c where parent_id = ?';
        const [rows] = await con.execute(sql, [contentPageId]);
        const myRows = rows as types.schema.ContentsTable[];
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
    // const getContentsInfo = async(contentPageId: string): Promise<ItemContentInfo|null> => {
    //     const sql = 'select * from contents c where content_page_id = ?';

    //     const [rows] = await con.execute(sql, [contentPageId]);
    //     const myRows = rows as ContentsTable[];
    //     if (myRows.length === 0) {
    //         return null;
    //     }

    //     const children = await getChildrenContentInfo(contentPageId);
    //     return {
    //         id: contentPageId,
    //         hasImage: myRows[0].thumbnail ? true : false,
    //         children,
    //     }
    // }
    
    try {
        // 位置コンテンツ
        const sql = `
        select i.*, ST_AsGeoJSON(i.location) as geojson, cdi.map_page_id
        from items i
        inner join contents_db_info cdi on i.contents_db_id = cdi.contents_db_id
        where map_page_id = ? and i.map_kind = ?
        `;
        const [rows] = await con.execute(sql, [mapPageId, mapKind]);
        const pointContents = [] as ItemDefine[];
        for(const row of rows as (types.schema.ItemsTable & {geojson: any})[]) {
            const contents: ItemContentInfo[] = [];

            const contentLinkSql = 'select * from item_content_link where item_page_id = ?';
            const [linkRows] = await con.execute(contentLinkSql, [row.item_page_id]);
            const linkRecords = linkRows as types.schema.ItemContentLink[];
            if (linkRecords.length > 0) {
                // 配下のコンテンツID取得
                for (const linkRecord of linkRecords) {
                    const children = await getChildrenContentInfo(linkRecord.content_page_id);
                    contents.push({
                        id: linkRecord.content_page_id,
                        hasImage: children.some(child => child.hasImage),
                        children,
                    });
                }
            }

            // itemがnameを持つならname。持たないなら、コンテンツtitle.
            const name = row.name ?? '';

            pointContents.push({
                id: row.item_page_id,
                name,
                position: {
                    type: 'geoJson',
                    geoJson: row.geojson,
                },
                geoProperties: row.geo_properties ? JSON.parse(row.geo_properties) : undefined,
                contents,
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
        
        return (rows as (types.schema.TrackGeoJsonTable & {last_edited_time: string})[]).map(row => {
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
                contents: [],
                lastEditedTime: row.last_edited_time,
            }
        });
    } finally {
        await con.commit();
        con.release();
    }

}