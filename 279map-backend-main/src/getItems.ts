import { getLogger } from 'log4js';
import { ConnectionPool } from '.';
import { PoolConnection } from 'mysql2/promise';
import { CurrentMap } from '../279map-backend-common/src';
import { GeometryItemsTable } from '../279map-backend-common/src/types/schema';
import { QueryGetItemsArgs } from './graphql/__generated__/types';
import { ItemContentInfo } from './api/getItem';
import { DatasourceLocationKindType, FeatureType, GeoProperties } from './types-common/common-types';
import { ItemDefineWithoudContents } from './types';

const apiLogger = getLogger('api');

export async function getItems({ param, currentMap }: {param:QueryGetItemsArgs; currentMap: CurrentMap}): Promise<ItemDefineWithoudContents[]> {
    if (!currentMap) {
        throw 'no currentMap';
    }
    const mapPageId = currentMap.mapId;
    const mapKind = currentMap.mapKind;
    if (!mapPageId || !mapKind) {
        throw 'no currentMap';
    }

    const con = await ConnectionPool.getConnection();

    try {
        const items = await selectItems(con, param, currentMap);

        if (param.excludeItemIds) {
            // 除外対象のアイテムを除く
            return items.filter(item => !param.excludeItemIds?.includes(item.id))
        } else {
            return items;
        }
    
    } catch(e){
        apiLogger.warn('getItem failed', e);
        await con.rollback();
        throw new Error('getItem failed');

    } finally {
        await con.commit();
        con.release();

    }

}

async function selectItems(con: PoolConnection, param: QueryGetItemsArgs, currentMap: CurrentMap): Promise<ItemDefineWithoudContents[]> {
    try {
        // TODO: $.titleはcontents_defineから取得した値をパラメタで渡す
        let sql = `
        select gi.*, ST_AsGeoJSON(gi.feature) as geojson, ds.location_kind, JSON_UNQUOTE(JSON_EXTRACT(c.contents , '$.title')) as title, d.last_edited_time 
        from geometry_items gi 
        left join contents c on c.data_id  = gi.data_id
        inner join datas d on d.data_id = gi.data_id 
        inner join data_source ds on ds.data_source_id = d.data_source_id
        inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
        where map_page_id = ? and d.data_source_id = ?
        and ST_Intersects(gi.feature, ST_GeomFromText(?,4326))
        and min_zoom <= ? AND ? < max_zoom
        `;
        const params = [currentMap.mapId, param.datasourceId, param.wkt, param.zoom, param.zoom];
        if (param.latestEditedTime) {
            sql += ' and d.last_edited_time > ?';
            params.push(param.latestEditedTime);
        }
        const [rows] = await con.execute(sql, params);
        const pointContents = [] as ItemDefineWithoudContents[];
        for(const row of rows as (GeometryItemsTable & {geojson: any; title: string | null; location_kind: DatasourceLocationKindType; last_edited_time: string})[]) {
            let lastEditedTime = row.last_edited_time;

            const geoProperties: GeoProperties = row.location_kind === DatasourceLocationKindType.Track ? {
                featureType: FeatureType.TRACK,
                max_zoom: row.max_zoom,
                min_zoom: row.min_zoom,
            } : JSON.parse(row.geo_properties);
            pointContents.push({
                id: row.data_id,
                datasourceId: param.datasourceId,
                name: row.title ?? '',
                geometry: row.geojson,
                geoProperties,
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
