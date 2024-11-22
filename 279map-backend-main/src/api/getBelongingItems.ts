import { ConnectionPool } from "..";
import { ContentBelongMapView, ContentsTable, CurrentMap, GeometryItemsTable } from "../../279map-backend-common/src";
import { getTitleValue } from "../api-common/convertContent";
import { QueryResolverReturnType } from "../graphql/type_utility";
import { DataId } from "../types-common/common-types";

/**
 * 指定のコンテンツに紐づくアイテム情報を返す
 * @param dataId 
 */
export async function getBelongingItem(dataId: DataId, currentMap: CurrentMap): QueryResolverReturnType<'getBelogingItems'> {
    const con = await ConnectionPool.getConnection();

    try {
        const hasLocation = await async function() {
            const sql = 'select * from geometry_items where data_id = ?';
            const [rows] = await con.query(sql, [dataId]);
            const records = rows as GeometryItemsTable[];
            return records.length > 0;
        }();

        const sql = `
        select * from content_belong_map cbm 
        inner join contents c on c.data_id = cbm.item_id 
        where map_page_id = ? and content_id = ?
        `;
        const [rows] = await con.query(sql, [currentMap.mapId, dataId]);
        const records = rows as (ContentBelongMapView & ContentsTable)[];

        if (records.length === 0) {
            return {
                hasLocation,
                belongingItems: [],
            }
        }

        const items = records.sort((a, b) => {
            const getWeight = (rec: (ContentBelongMapView & ContentsTable)) => {
                // 現在の地図種別のものが最優先
                if (rec.map_kind === currentMap.mapKind) return 0;
                // アイテム近い（deepが低い）コンテンツが優先
                return rec.deep + 1;
            }
            const aWeight = getWeight(a);
            const bWeight = getWeight(b);
            return aWeight - bWeight;
        });

        return {
            hasLocation,
            belongingItems: items.map(item => {
                return {
                    itemId: item.item_id,
                    mapKind: item.map_kind,
                    name: getTitleValue(item.contents ?? {}) ?? '',
                }
            }),
        }

    } finally {
        con.release();
    }
}