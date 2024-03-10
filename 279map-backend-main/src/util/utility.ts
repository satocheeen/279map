import { ConnectionPool } from '..';
import mysql, { PoolConnection } from 'mysql2/promise';
import { ContentsTable, ItemsTable } from '../../279map-backend-common/src/types/schema';
import { CurrentMap } from '../../279map-backend-common/src';
import { buffer, circle, featureCollection, lineString, multiLineString, multiPolygon, point, polygon, union } from '@turf/turf';
import { geojsonToWKT, wktToGeoJSON } from '@terraformer/wkt';
import crypto from 'crypto';
import * as geojson from 'geojson';
import { MapKind } from '../graphql/__generated__/types';
import { DataId } from '../types-common/common-types';
import { schema } from '../../279map-backend-common/dist';

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

export async function getContent(content_id: DataId): Promise<ContentsTable|null> {
    const con = await ConnectionPool.getConnection();
    try {
        const sql = "select * from contents where content_page_id = ? and data_source_id = ?";
        const [rows] = await con.execute(sql, [content_id.id, content_id.dataSourceId]);
        if ((rows as []).length === 0) {
            return null;
        }
        return (rows as ContentsTable[])[0];

    } catch(e) {
        throw 'getContent' + e;
    } finally {
        await con.rollback();
        con.release();
    }
}

/**
 * 指定のコンテンツの祖先にいるアイテムIDを返す
 * @param contentId 
 */
export async function getAncestorItemId(contentId: DataId): Promise<DataId | undefined> {
    const myCon = await ConnectionPool.getConnection();

    try {
        const sql = `
        select * from item_content_link icl 
        where content_page_id = ? and content_datasource_id = ?
        `;
        const [rows] = await myCon.execute(sql, [contentId.id, contentId.dataSourceId]);
        if ((rows as schema.ItemContentLink[]).length > 0) {
            const record = (rows as ItemsTable[])[0];
            return {
                id: record.item_page_id,
                dataSourceId: record.data_source_id,
            };
        }

        // 対応するアイテムが存在しない場合は、親コンテンツを辿る
        const contentQuery = 'select * from contents where content_page_id = ? and data_source_id = ?';
        const [contentRows] = await myCon.execute(contentQuery, [contentId.id, contentId.dataSourceId]);
        if ((contentRows as []).length === 0) {
            return;
        }
        const contentRecord = (contentRows as ContentsTable[])[0];
        if (!contentRecord.parent_id || !contentRecord.parent_datasource_id) {
            return;
        }
        const ancestor = await getAncestorItemId(
            {
                id: contentRecord.parent_id,
                dataSourceId: contentRecord.data_source_id,
            }
        );
        return ancestor;
    
    } finally {
        await myCon.commit();
        myCon.release();
    }

}

/**
 * 指定のアイテムのwktを返す
 * @param itemId 
 * @returns 
 */
export async function getItemWkt(itemId: DataId): Promise<string|undefined> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
        SELECT ST_AsText(ST_Envelope(location)) as location
        from items i 
        where data_source_id = ? and item_page_id = ?
        `;
        const [rows] = await con.execute(sql, [itemId.dataSourceId, itemId.id]);
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

export async function getDatasourceRecord(datasourceId: string): Promise<schema.DataSourceTable> {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = 'select * from data_source where data_source_id = ?';
        const [rows] = await con.execute(sql, [datasourceId]);
        if ((rows as []).length === 0) {
            throw new Error('data_source not find. ->' + datasourceId);
        }
        return (rows as schema.DataSourceTable[])[0];

    } finally {
        await con.commit();
        con.release();
    }
}

export function isEqualId(id1: DataId, id2: DataId): boolean {
    return id1.id === id2.id && id1.dataSourceId === id2.dataSourceId;
}
