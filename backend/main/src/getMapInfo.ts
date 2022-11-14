import { MapPageInfoTable } from '279map-backend-common/dist/types/schema';
import { APIFunc, ConnectionPool } from '.';
import { GetMapInfoParam, GetMapInfoResult } from '279map-common/dist/api';
import { MapKind } from '279map-common/dist/types';
import { Auth } from '279map-common/dist/types';

type Result = {
    apiResult: GetMapInfoResult;
    defaultMapKind: MapKind;
}
/**
 * 指定の地図データページ配下のコンテンツ情報を返す
 * @param pageId Notion地図データページID
 */
export const getMapInfo: APIFunc<GetMapInfoParam, GetMapInfoResult> = async({ param }) => {
    const result = await getMapInfoSub(param);

    return result.apiResult;
}
async function getMapInfoSub(param: GetMapInfoParam): Promise<Result> {
    const pageId = param.mapId;
    const auth = param.auth;
    const mapKind = param.mapKind;
    
    const mapPageInfo = await getMapPageInfo(pageId);
    if (mapPageInfo === null) {
        // 該当地図が存在しない場合
        throw '地図が存在しません:' + pageId;
    }
    const targetMapKind = mapKind ? mapKind : mapPageInfo.default_map;

    // エクステントを取得
    const extent = await getExtent(mapPageInfo.map_page_id, targetMapKind);

    // 使用地図を取得
    const useMaps = mapPageInfo.use_maps.split(',').map(mapKindStr => {
        return mapKindStr as MapKind;
    });

    // // カテゴリを取得
    // const category = await getCategory(mapPageInfo.map_page_id, targetMapKind);

    // 権限判定
    let authLv = Auth.View;
    if (mapPageInfo.edit_auth_hash && auth && mapPageInfo.edit_auth_hash === auth) {
        authLv = Auth.Edit;
    }
    console.log('authLv', authLv);
    return {
        defaultMapKind: mapPageInfo.default_map,
        apiResult: {
            mapId: mapPageInfo.map_page_id,
            name: mapPageInfo.title,
            mapKind: mapKind ? mapKind : mapPageInfo.default_map,
            extent,
            useMaps,
            authLv,
        },
    }

}

/**
 * 指定の地図データページIDの情報を取得する
 * @param pageId Notion地図データページID または Alias
 */
async function getMapPageInfo(pageId: string): Promise<MapPageInfoTable | null> {
    const con = await ConnectionPool.getConnection();

    try {
        const [rows] = await con.execute('SELECT * FROM map_page_info WHERE map_page_id=? OR replace(map_page_id, "-", "")=? OR alias=?', [pageId, pageId, pageId]);
        if ((rows as MapPageInfoTable[]).length === 0) {
            return null;
        }
        const record = (rows as MapPageInfoTable[])[0];
        return record;
    } finally {
        await con.commit();
        con.release();
    }

}

/**
 * 指定の地図データページIDの全コンテンツを含むエクステントを返す
 * @param mapPageId 
 */
async function getExtent(mapPageId: string, mapKind: MapKind): Promise<[number,number,number,number]> {
    const con = await ConnectionPool.getConnection();

    try {
        // 位置コンテンツ
        // -- POINT
        const pointExtent = await async function(){
            const sql = `
            select MAX(ST_X(location)) as max_x, MAX(ST_Y(location)) as max_y, MIN(ST_X(location)) as min_x, MIN(ST_Y(location)) as min_y from items pc
            inner join contents_db_info cdi on pc.contents_db_id = cdi.contents_db_id 
            where map_page_id = ? and map_kind = ?
            `;
            const [rows] = await con.execute(sql, [mapPageId, mapKind]);
            if((rows as any[]).length === 0) {
                throw 'Extent error';
            }
            const record = (rows as any[])[0];
            if (!record.min_y) {
                return undefined;
            }
            const min_y = record.min_y ? record.min_y : 0;
            const min_x = record.min_x ? record.min_x : 0;
            const max_y = record.max_y ? record.max_y : 0;
            const max_x = record.max_x ? record.max_x : 0;
            return { min_x, min_y, max_x, max_y };
        }();

        // -- POLYGON, MULTILINESTRING
        const polygonExtent = await async function() {
            const sql = `
            select MIN(ST_X(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 1))) as min_x, MAX(ST_X(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 2))) as max_x, MIN(ST_Y(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 1))) as min_y, MAX(ST_Y(ST_PointN(ST_ExteriorRing(ST_Envelope(location)), 3))) as max_y 
            from items pc
            inner join contents_db_info cdi on pc.contents_db_id = cdi.contents_db_id 
            where map_page_id = ? and map_kind = ?
            `;
            const [rows] = await con.execute(sql, [mapPageId, mapKind]);
            if((rows as any[]).length === 0) {
                throw 'Extent error';
            }
            const record = (rows as any[])[0];
            if (!record.min_y) {
                return undefined;
            }
            const min_y = record.min_y ? record.min_y : 0;
            const min_x = record.min_x ? record.min_x : 0;
            const max_y = record.max_y ? record.max_y : 0;
            const max_x = record.max_x ? record.max_x : 0;
            return { min_x, min_y, max_x, max_y };
        }();

        // TODO: 軌跡コンテンツ

        if (pointExtent !== undefined && polygonExtent !== undefined) {
            const min_x = Math.min(pointExtent.min_x, polygonExtent.min_x);
            const min_y = Math.min(pointExtent.min_y, polygonExtent.min_y);
            const max_x = Math.max(pointExtent.max_x, polygonExtent.max_x);
            const max_y = Math.max(pointExtent.max_y, polygonExtent.max_y);
    
            return [min_x, min_y, max_x, max_y];
        }
        if (polygonExtent !== undefined) {
            return [polygonExtent.min_x, polygonExtent.min_y, polygonExtent.max_x, polygonExtent.max_y];
        }
        if (pointExtent !== undefined) {
            return [pointExtent.min_x, pointExtent.min_y, pointExtent.max_x, pointExtent.max_y];
        }
        return [0, 0, 0, 0];

    } finally {
        await con.commit();
        con.release();
    }
}

// /**
//  * 指定の地図ページのカテゴリ情報を返す
//  * @param mapPageId 
//  */
// async function getCategory(mapPageId: string, mapKind: MapKind): Promise<CategoryInfo[]> {
//     const con = await ConnectionPool.getConnection();

//     try {
//         // コンテンツからカテゴリ一覧取得
//         const sql = `
//             SELECT map_page_id, category from contents pc
//             INNER JOIN items itm ON pc.item_page_id = itm.item_page_id
//             INNER JOIN contents_db_info cdi ON itm.contents_db_id = cdi .contents_db_id
//             WHERE map_page_id = ? and map_kind = ?
//             `;
//         const [rows] = await con.execute(sql, [mapPageId, mapKind]);

//         const categoryList = [] as string[];
//         (rows as {map_page_id: string; category: string | null}[]).forEach(row => {
//             if (!row.category) {
//                 return;
//             }
//             const categories = JSON.parse(row.category) as string[];
//             categories.forEach(category => {
//                 if (categoryList.indexOf(category) === -1) {
//                     categoryList.push(category);
//                 }
//             });
//         });

//         const colors = randomColor({
//             seed: 0,
//             count: categoryList.length,
//             format: 'rgb',
//         });
//         return categoryList.map((category, index) => {
//             return {
//                 id: category,
//                 title: category,
//                 color: colors[index],
//             }
//         });
        
//     } finally {
//         await con.commit();
//         con.release();

//     }

// }