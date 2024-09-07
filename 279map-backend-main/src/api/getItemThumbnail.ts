import { PoolConnection } from "mysql2/promise";
import { ConnectionPool } from "..";
import { ContentBelongMapView, GeometryItemsTable, ImagesTable, OriginalIconsTable } from "../../279map-backend-common/src";
import { FeatureType, GeoProperties } from "../types-common/common-types";

type Param = {
    mapId: string;
    itemId: string;
}

/**
 * 指定の地図の指定のアイテムのサムネイル画像を返す
 * @param param 
 */
export async function getItemThumbnail(param: Param) {
    const con = await ConnectionPool.getConnection();

    try {
        const sql = `
            select i.medium, cbm.* from content_belong_map cbm 
            inner join images i on i.data_id = cbm.content_id 
            where map_page_id = ? and item_id = ?
        `
        const [rows] = await con.query(sql, [param.mapId, param.itemId]);
        const records = (rows as (ImagesTable)[]);

        if (records.length > 0) {
            return records[0].medium;
        }

        // コンテンツ画像が存在しない場合は、ピン or 建物のアイコン画像
        const sql2 = `
            select gi.*, cbm.*
            from content_belong_map cbm 
            inner join geometry_items gi on gi.data_id = cbm.item_id 
            where map_page_id = ? and item_id = ?
        `
        const [itemRows] = await con.query(sql2, [param.mapId, param.itemId]);
        const itemRecords = (itemRows as (ContentBelongMapView & GeometryItemsTable)[]);
        if (itemRecords.length === 0) {
            return null;
        }
        const geoProperties = JSON.parse(itemRecords[0].geo_properties) as GeoProperties;
        if (geoProperties.featureType !== FeatureType.STRUCTURE) {
            return null;
        }
        if (!geoProperties.icon) {
            return null;
        }
        if (geoProperties.icon.type === 'original') {
            const image = await getOriginalIconImage(con, geoProperties.icon.id);
            return image;
        } else {
            // TODO: デフォルト画像
        }

        return null;

    } finally {
        con.release();
    }

}

async function getOriginalIconImage(con: PoolConnection, iconId: string) {
    const sql = `
    select * from original_icons oi 
    where icon_page_id = ?
    `;

    const [rows] = await con.query(sql, [iconId]);
    const records = rows as OriginalIconsTable[];
    if (records.length === 0) return null;
    return records[0].base64;
}