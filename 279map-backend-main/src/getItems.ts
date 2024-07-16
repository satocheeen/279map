import { getLogger } from 'log4js';
import { ConnectionPool } from '.';
import { CurrentMap } from '../279map-backend-common/src';
import { GeometryItemsTable } from '../279map-backend-common/src/types/schema';
import { QueryGetItemsArgs } from './graphql/__generated__/types';
import { ItemContentInfo } from './api/getItem';
import { DatasourceLocationKindType, FeatureType, GeoProperties } from './types-common/common-types';
import { ItemDefineWithoutContents } from './types';
import { DataSourceTable } from '../279map-backend-common/dist';

const apiLogger = getLogger('api');

export async function getItems({ param, currentMap }: {param:QueryGetItemsArgs; currentMap: CurrentMap}): Promise<ItemDefineWithoutContents[]> {

    const items = await selectItems(param, currentMap);

    if (param.excludeItemIds) {
        // 除外対象のアイテムを除く
        return items.filter(item => !param.excludeItemIds?.includes(item.id))
    } else {
        return items;
    }
    
}

async function selectItems(param: QueryGetItemsArgs, currentMap: CurrentMap): Promise<ItemDefineWithoutContents[]> {
    const con = await ConnectionPool.getConnection();

    try {
        // contents内のtitle値を取得するために、titleに該当するkey値を取得する
        const dsQuery = 'select * from data_source where data_source_id = ?';
        const [dsRows] = await con.query(dsQuery, [param.datasourceId]);
        if ((dsRows as DataSourceTable[]).length === 0) {
            throw new Error('datasource not found');
        }
        const datasource = (dsRows as DataSourceTable[])[0];
        const titleDef = datasource.contents_define?.find(def => def.type === 'title');

        let sql = `
        select gi.*, ST_AsGeoJSON(gi.feature) as geojson, ds.location_kind, JSON_UNQUOTE(JSON_EXTRACT(c.contents , '$.${titleDef?.key ?? 'title'}')) as title, d.last_edited_time 
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
        const pointContents = [] as ItemDefineWithoutContents[];
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
        pointContents.push({
            datasourceId: 'hoge',
            name: '水深',
            id: 12345,
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [137.26410894541078, 37.525280174316056],
                        [137.27414047156507, 37.525280174316056],
                        [137.27414047156507, 37.535508716528185],
                        [137.26410894541078, 37.535508716528185],
                        [137.26410894541078, 37.525280174316056]
                    ]
                ],
            },
            geoProperties: {
                featureType: FeatureType.STATIC_IMAGE,
                url: './kinoura_water_depth.jpg',
                opacity: 0.6,
            },
            lastEditedTime: '',
        })

        return pointContents;

    } catch(e) {
        apiLogger.warn('selectItems failed', e);
        apiLogger.warn('getItem failed', e);
        await con.rollback();
        throw new Error('getItem failed');

    } finally {
        con.release();

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
