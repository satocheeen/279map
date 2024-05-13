import { ConnectionPool } from '..';
import { DataSourceTable, DatasTable } from '../../279map-backend-common/src/types/schema';
import { buffer, circle, featureCollection, lineString, multiLineString, multiPolygon, point, polygon, union } from '@turf/turf';
import { geojsonToWKT, wktToGeoJSON } from '@terraformer/wkt';
import crypto from 'crypto';
import * as geojson from 'geojson';
import { ContentFieldDefine, ContentValueMap, DataId, DatasourceLocationKindType, MapKind } from '../types-common/common-types';
import { MapDataSourceLinkTable } from '../../279map-backend-common/src';
import { Auth } from '../graphql/__generated__/types';

type Extent = number[];

export function getExtentWkt(ext: Extent): string {
    const [lon1, lat1, lon2, lat2] = ext;
    return `POLYGON((${lon1} ${lat1},${lon1} ${lat2},${lon2} ${lat2},${lon2} ${lat1},${lon1} ${lat1}))`;
}

export function convertBase64ToBinary(base64: string) {
    // format情報抽出
    const regex = /^([^;]*);?base64,(.*)/;
    const hit = base64.match(regex);
    if (!hit) {
        throw 'image format undefined.';
    }
    const format = hit[1];
    const body = hit[2];

    const img = Buffer.from(body, 'base64');

    return {
        contentType: 'image/' + format,
        binary: img,
    };
}

type GetDataResult = DatasTable & {
    map_page_id: string;
    mapKind: MapKind;
    hasContents: boolean;
    hasItem: boolean;
}
/**
 * 指定のidに紐づく情報を返す。
 * @param id 
 * @returns 複数の地図に紐づく場合を考慮して、一覧で返す。
 */
export async function getData(id: DataId): Promise<GetDataResult[]> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = `
        select d.*, mdl.map_page_id, ds.location_kind, count(c.data_id) as contents_num, COUNT(gi.data_id) as items_num  from datas d 
        inner join data_source ds on ds.data_source_id = d.data_source_id 
        inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
        left join contents c on c.data_id = d.data_id 
        left join geometry_items gi on gi.data_id = d.data_id 
        group by d.data_id, mdl.map_page_id 
        having d.data_id = ?
        `;
        const [rows] = await con.query(sql, [id]);

        const records = rows as (DatasTable & { map_page_id: string; location_kind: DatasourceLocationKindType; contents_num: number; items_num: number })[];

        return records.map(rec => {
            return Object.assign({}, rec, {
                mapKind: [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track].includes(rec.location_kind) ? MapKind.Real : MapKind.Virtual,
                hasContents: rec.contents_num > 0,
                hasItem: rec.items_num > 0,
            })
        })

    } catch(e) {
        throw new Error('getData error.' + e);

    } finally {
        await con.rollback();
        con.release();
    }
}

/**
 * 指定のアイテムのwktを返す
 * @param itemId 
 * @returns 
 */
export async function getItemWkt(itemId: DataId): Promise<string|undefined> {
    const con = await ConnectionPool.getConnection();

    // TODO: 複数ヒットするケース（Track）の考慮
    try {
        const sql = `
        SELECT ST_AsText(ST_Envelope(feature)) as location
        from geometry_items gi 
        where data_id = ?
        `;
        const [rows] = await con.execute(sql, [itemId]);
        if ((rows as []).length === 0) {
            return;
        }
        const location = (rows as {location: string}[])[0].location;
        return location;
    
    } finally {
        await con.rollback();
        con.release();
    }

}

export async function getItemsWkt(itemIdList: DataId[]): Promise<string|undefined> {
    let unionFeature;
    
    for (const id of itemIdList) {
        const wkt = await getItemWkt(id);
        if (!wkt) continue;
        const geoJson = wktToGeoJSON(wkt);
        const ply = function() {
            switch(geoJson.type) {
                case 'Polygon':
                    return polygon(geoJson.coordinates);
                case 'MultiPolygon':
                    return multiPolygon(geoJson.coordinates);
                case 'Point':
                    const p = point(geoJson.coordinates);
                    return circle(p, .05);
            }
        }();
        if (!ply) continue;
        if (!unionFeature) {
            unionFeature = ply;
        } else  {
            unionFeature = union(unionFeature, ply) ?? unionFeature;
        }
    }
    if (unionFeature)
        return geojsonToWKT(unionFeature.geometry)
}

export function createHash(): string {
    // 生成するハッシュの長さ（バイト数）
    const hashLength = 32;

    // ランダムなバイト列を生成する
    const randomBytes = crypto.randomBytes(hashLength);

    // バイト列をハッシュ化する
    const hash = crypto.createHash('sha256').update(randomBytes).digest('hex');

    return hash;
}

export function geoJsonToTurfPolygon(geoJson: geojson.Geometry | geojson.GeoJSON) {
    try {
        switch(geoJson.type) {
            case 'Polygon':
                return polygon(geoJson.coordinates);
            case 'MultiPolygon':
                return multiPolygon(geoJson.coordinates);
            case 'Point':
                return circle(geoJson.coordinates, .05);
            case 'LineString':
                return buffer(lineString(geoJson.coordinates), 0.05);
            case 'MultiLineString':
                return buffer(multiLineString(geoJson.coordinates), 0.05);
        }
    
    } catch(e) {
        console.warn('geoJsonToTurfPolygon faile', geoJson, e);
        return;
    }
}

export function geoJsonToTurfFeatureCollection(geoJsons: (geojson.Geometry | geojson.GeoJSON)[]) {
    const list = featureCollection([]);
    geoJsons.forEach(geoJson => {            
        try {
            switch(geoJson.type) {
                case 'Polygon':
                    list.features.push(polygon(geoJson.coordinates));
                    break;
                case 'MultiPolygon':
                    list.features.push(multiPolygon(geoJson.coordinates));
                    break;
                case 'Point':
                    list.features.push(circle(geoJson.coordinates, .05));
                    break;
                case 'LineString':
                    list.features.push(buffer(lineString(geoJson.coordinates), 0.05));
                    break;
                case 'MultiLineString':
                    list.features.push(buffer(multiLineString(geoJson.coordinates), 0.05));
            }
        
        } catch(e) {
            console.warn('geoJsonToTurfFeatureCollection faile', geoJson, e);
            return;
        }
    })
    return list;
}

export function isEqualId(id1: DataId, id2: DataId): boolean {
    return id1 === id2;
    // return id1.id === id2.id && id1.dataSourceId === id2.dataSourceId;
}

/**
 * コンテンツ登録や更新時に、誤った値がODBAに渡されないように処置する
 * @param mapId 地図ID
 * @param datasourceId コンテンツデータソースID
 * @param values 
 * @return 処置したあとの値
 */
export async function cleanupContentValuesForRegist(mapId: string, datasourceId: string, values: ContentValueMap): Promise<ContentValueMap> {
    const con = await ConnectionPool.getConnection();

    try {
        // 項目定義を取得
        const sql = `
            select * from data_source ds 
            inner join map_datasource_link mdl on ds.data_source_id = mdl.data_source_id 
            where map_page_id = ? and ds.data_source_id = ?
        `;
        const [rows] = await con.execute(sql, [mapId, datasourceId]);
        if ((rows as []).length === 0) {
            throw new Error('data_source not find. ->' + datasourceId);
        }
        const contents_define = (rows as (MapDataSourceLinkTable & DataSourceTable)[])[0].contents_define as ContentFieldDefine[];

        const newValues = {} as ContentValueMap;
        Object.entries(values).forEach(([key, value]) => {
            const field = contents_define.find(def => def.key === key);
            if (!field) return;
            if ('readonly' in field && field.readonly) {
                // readonly項目は、はじく
                return;
            }
            if (field.type === 'image' && typeof value === 'number') {
                // 画像の場合は、修正前の画像ID（数値）が誤って入ってくる可能性があるのでチェックしてはじく
                return;
            }

            newValues[key] = value;
        })

        return newValues;

    } finally {
        con.release();
    }
}

export function compareAuth(a: Auth, b: Auth) {
    const weightFunc = (auth: Auth) => {
        switch(auth) {
            case Auth.None:
            case Auth.Request:
                return 0;
            case Auth.View:
                return 1;
            case Auth.Edit:
                return 2;
            case Auth.Admin:
                return 3;
        }
    }
    const aWeight = weightFunc(a);
    const bWeight = weightFunc(b);
    return aWeight - bWeight;
}