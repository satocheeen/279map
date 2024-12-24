/**
 * トランザクションテーブル関連の処理群
 */

import { wktToGeoJSON } from "@terraformer/wkt";
import { ConnectionPool } from "..";
import { CurrentMap, TransactionQueueTable } from "../../279map-backend-common/src";
import { MutationUpdateDataArgs, QueryGetItemsArgs, QueryGetItemsByIdArgs } from "../graphql/__generated__/types";
import { ItemDefineWithoutContents } from "../types";
import * as turf from '@turf/turf';
import { Geometry } from "geojson";

/**
 * トランザクションTBLに登録する
 * @param sessionKey クライアントのセッションキー
 * @param args クライアントから渡された情報
 * @returns 
 */
export async function registTransaction(
    { sessionKey, currentMap, operation, args}
    : { sessionKey: string; currentMap: CurrentMap, operation: string; args: object })
{
    const con = await ConnectionPool.getConnection();

    const query = `
        INSERT INTO transaction_queue (id, session_key, map_page_id, map_kind, operation, param, status)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?)
    `;

    try {
        await con.execute(query, [sessionKey, currentMap.mapId, currentMap.mapKind, operation, args, 'Pending']);

    } catch(err) {
        throw new Error('faield transaction regist: ' + err);

    } finally {
        con.release();
    }
}

/**
 * getItemsの結果にトランザクションの内容をマージしたものを返す
 * @param items 
 */
export async function mergeTransactionToResultOfGetItems(
    { items, param, currentMap }
    : { items: ItemDefineWithoutContents[]; param: QueryGetItemsArgs; currentMap: CurrentMap }
): Promise<ItemDefineWithoutContents[]> {

    const result = await mergeTransactionToResultOfGetItemsSub({
        items,
        currentMap,
        isTargetFunc(transactionRec) {
            const args = transactionRec.param as MutationUpdateDataArgs;
            const newGeometry = args.item?.geometry;
            if (!newGeometry) return false;
            return containItemInTheArea(newGeometry, param.wkt);
        }
    });
    return result;

}

/**
 * getItemsByIdの結果にトランザクションの内容をマージしたものを返す
 * @param items 
 */
export async function mergeTransactionToResultOfGetItemsById(
    { items, param, currentMap }
    : { items: ItemDefineWithoutContents[]; param: QueryGetItemsByIdArgs; currentMap: CurrentMap }
): Promise<ItemDefineWithoutContents[]> {

    const result = await mergeTransactionToResultOfGetItemsSub({
        items,
        currentMap,
        isTargetFunc(transactionRec) {
            const args = transactionRec.param as MutationUpdateDataArgs;
            return param.targets.includes(args.id);
        }
    });
    return result;
}

/**
 * getItemsの結果にトランザクションの内容をマージしたものを返す
 * @param items 
 */
async function mergeTransactionToResultOfGetItemsSub(
    { items, isTargetFunc, currentMap }
    :
    {
        items: ItemDefineWithoutContents[];
        // 指定のトランザクションデータがマージ対象かを判定するfunction
        isTargetFunc: (rec: TransactionQueueTable) => boolean;
        currentMap: CurrentMap
    }
): Promise<ItemDefineWithoutContents[]> {

    const con = await ConnectionPool.getConnection();

    try {
        // トランザクション情報取得
        const sql = `
            select * from transaction_queue tq 
            where status = 'Pending'
            order by created_at
        `;
        const [ rows ] = await con.execute(sql);

        return (rows as TransactionQueueTable[]).reduce((acc, cur) => {
            // TODO: 新規追加されたアイテムがgetItemsByIdの取得対象の場合、結果に追加する

            if (cur.operation === 'updateData') {
                const args = cur.param as MutationUpdateDataArgs;
                // 更新されたアイテムがgetItemsに含まれるか確認
                const hit = acc.find(item => item.id === args.id);
                if (!hit) return acc;

                // トランザクションの情報に合わせて結果を更新
                if (args.deleteItem) {
                    // アイテム削除の場合、結果から除外する
                    return acc.filter(item => item.id !== args.id);
                }
                const newGeometry = args.item?.geometry;
                if (!newGeometry) return acc;
                const isTarget = isTargetFunc(cur);
                if (isTarget) {
                    // getItemsの取得対象の場合、結果情報更新
                    return acc.map(item => {
                        if (item.id !== args.id) return item;
                        const newItem = structuredClone(item);
                        newItem.geometry = newGeometry;
                        if (args.item?.geoProperties) {
                            newItem.geoProperties = args.item.geoProperties;
                        }
                        // TODO: newItem.contentの更新
                        newItem.lastEditedTime = cur.created_at;
                        return newItem;
                    })

                } else {
                    // getItemsの取得範囲外になる場合、結果から除外する
                    return acc.filter(item => item.id !== args.id);
                }
            }

            // TODO: 削除されたアイテムがgetItemsに含まれている場合、結果から除外する
            return acc;
        }, items);

    } finally {
        con.release();
    }
}

/**
 * areaWkt内にitemGeometryが含まれるかを返す
 * @param itemGeometry 
 * @param areaWkt 
 * @returns 含まれる場合、true。含まれない場合、false。
 */
function containItemInTheArea(itemGeometry: Geometry, areaWkt: string) {
    const areaJson = wktToGeoJSON(areaWkt);
    if (areaJson.type !== 'MultiPolygon' && areaJson.type !== 'Polygon') {
        return false;
    }
    if (itemGeometry.type === 'Point') {
        return turf.booleanPointInPolygon(itemGeometry, areaJson);
        
    } else {
        return turf.booleanIntersects(areaJson, itemGeometry);
    }

}