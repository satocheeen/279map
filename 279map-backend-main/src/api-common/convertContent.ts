import { DataSourceTable, ContentsTable, CurrentMap, ImagesTable, MapDataSourceLinkTable, ContentBelongMapView } from "../../279map-backend-common/src";
import { ContentsDefine, ContentsDetail } from "../graphql/__generated__/types";
import { ContentFieldDefine, ContentValue, ContentValueMap, DataId, DatasourceLocationKindType, MapKind } from "../types-common/common-types";
import { PoolConnection } from "mysql2/promise";

type Record = ContentsTable & DataSourceTable & MapDataSourceLinkTable;

/**
 * contentsテーブルの値をContentsDefineの形式に変換して返す
 * @param row
 */
export async function convertContentsToContentsDefine(con: PoolConnection, row: Record, currentMap: CurrentMap): Promise<ContentsDetail & Omit<ContentsDefine, 'linkedContents'>> {
    const id = row.data_id;
    const anotherMapItemIds = await getAnotherMapKindItemsUsingTheContent(con, id, currentMap);
    const usingOtherMap = anotherMapItemIds.length > 0 ? true : await checkUsingAnotherMap(con, id, currentMap.mapId);

    const readonly = function() {
        if (row.location_kind === DatasourceLocationKindType.VirtualItem) return true;
        return row.config.readonly;
    }();

    let hasValue = false;
    const titleField = function() {
        const contentsDefine = row.contents_define as ContentFieldDefine[];
        return contentsDefine.find(fd => fd.type === 'title');
    }();

    // 使用する項目に絞る
    const values: ContentValueMap = await async function() {
        if (!('contentFieldKeyList' in row.mdl_config)) {
            return {};
        }
        const allValues = row.contents ?? {};
        const result: ContentValueMap = {};

        for (const key of row.mdl_config.contentFieldKeyList) {
            const def = row.contents_define?.find(def => def.key === key);
            if (!def) continue;

            const fixedValue = await async function(): Promise<ContentValue> {
                const val = allValues[key];
                switch(def.type) {
                    case 'title':
                    case 'string':
                    case 'text':
                    case 'date':
                    case 'url':
                        return {
                            type: def.type,
                            value: val + '',
                        }
                    case 'number':
                        return {
                            type: def.type,
                            value: typeof val === 'number' ? val : parseInt(val),
                        }
                    case 'category':
                    case 'single-category':
                    case 'image':
                        return {
                            type: def.type,
                            value: Array.isArray(val) ? val : [],
                        }
                    case 'link':
                        const value = await Promise.all((val as DataId[]).map(async(id) => {
                            // 指定のアイテムの名称と使用地図を取得する
                            const itemInfo = await getItemInfo(con, id, currentMap.mapId, row.contents_define ?? []);
                            return {
                                dataId: id,
                                name: itemInfo.name,
                                belongingItems: itemInfo.belongingItems,
                            }
                        }));
                        return {
                            type: def.type,
                            value,
                        }
                }
            }();
            result[key] = fixedValue;

            // 値があるかどうかチェック
            const hasValueItem = function() {
                if (!fixedValue) return false;
                // -- タイトルは値と見做さない
                if (key === titleField?.key) return false;
                if ((fixedValue.type === 'image' || fixedValue.type === 'link' || fixedValue.type === 'category') && fixedValue.value.length === 0) {
                    // category項目, image項目またはlink項目で配列0なら、値ありと見做さない
                    return false;
                }
                if ((fixedValue.type === 'string' || fixedValue.type === 'text') && fixedValue.value.length === 0) {
                    // テキスト項目で文字数0なら、値ありと見做さない
                    return false;
                }
                return true;
            }();
            if (hasValueItem) {
                hasValue = true;
            }
        }
        return result;
    }();

    // 画像が存在する場合は、valuesにIDを含めて返す
    let hasImage = false;
    const imageFields = function() {
        const contentsDefine = row.contents_define as ContentFieldDefine[];
        return contentsDefine.filter(fd => fd.type === 'image');
    }() ?? [];
    for (const imageField of imageFields) {
        const ids = await getImageIdList(con, row.data_id, imageField);
        values[imageField.key] = {
            type: 'image',
            value: ids,
        };
        if (ids.length > 0) hasImage = true;
    }
    const linkedContents = Object.values(values).reduce((acc, cur) => {
        if (cur.type !== 'link') return acc;
        const ids = cur.value.map(v => v.dataId);
        return [...acc, ...ids];
    }, [] as DataId[]);

    return {
        id,
        datasourceId: row.data_source_id,
        values,
        hasValue,
        hasImage,
        anotherMapItemId: anotherMapItemIds.length > 0 ? anotherMapItemIds[0] : undefined,  // 複数存在する場合は１つだけ返す
        usingOtherMap,
        readonly,
        // linkedContents,
    };
}

/**
 * 指定のコンテンツが、もう片方の地図から参照されている場合に、そのItemIDを返す
 * @param con 
 * @param contentId 
 * @param currentMap 
 * @returns 
 */
async function getAnotherMapKindItemsUsingTheContent(con: PoolConnection, contentId: DataId, currentMap: CurrentMap): Promise<DataId[]> {

    try {
        // もう片方の地図に存在するかチェック
        const sql = `
        select dl.from_data_id as data_id from data_link dl 
        where dl.to_data_id = ?
        and EXISTS (
            select * from datas d
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where mdl.map_page_id = ? and ds.location_kind in (?)
            and d.data_id = dl.from_data_id 
        )
        union
        select d2.data_id from datas d2
        inner join geometry_items gi on gi.data_id = d2.data_id 
        inner join data_source ds2 on ds2.data_source_id = d2.data_source_id 
        inner join map_datasource_link mdl2 on mdl2.data_source_id = d2.data_source_id 
        where d2.data_id = ?
        and mdl2.map_page_id = ? and ds2.location_kind in (?)
        `;
        const anotherMapKind = currentMap.mapKind === MapKind.Virtual ? [DatasourceLocationKindType.RealItem, DatasourceLocationKindType.Track] : [DatasourceLocationKindType.VirtualItem];
        const query = con.format(sql, [contentId, currentMap.mapId, anotherMapKind, contentId, currentMap.mapId, anotherMapKind]);
        const [rows] = await con.execute(query);

        return (rows as {data_id: DataId}[]).map((row): DataId => {
            return row.data_id;
        });

    } finally {
    }
}

/**
 * 指定のコンテンツが他の地図で使用されているかチェック
 * @param con 
 * @param contentId 
 * @param mapId 
 */
async function checkUsingAnotherMap(con: PoolConnection, contentId: DataId, mapId: string): Promise<boolean> {

    try {
        const sql = `
        select * from data_link dl 
        where dl.to_data_id = ?
        and EXISTS (
            select * from datas d
            inner join data_source ds on ds.data_source_id = d.data_source_id 
            inner join map_datasource_link mdl on mdl.data_source_id = d.data_source_id 
            where mdl.map_page_id <> ?
            and d.data_id = dl.from_data_id 
        )
        `;
        const [rows] = await con.execute(sql, [contentId, mapId]);
        return (rows as []).length > 0;
    
    } finally {
    }
}

/**
 * 指定のデータの指定のイメージ列に属する画像IDリストを返す
 * @param dataId
 * @param imageField 
 */
async function getImageIdList(con: PoolConnection, dataId: DataId, imageField: ContentFieldDefine): Promise<DataId[]> {
    try {
        const imageQuery = 'select * from images where data_id = ? and field_key = ?';
        const [rows] = await con.execute(imageQuery, [dataId, imageField.key]);
        const ids = (rows as ImagesTable[]).map(row => row.image_id);
        return ids;
    
    } finally {
    }

}

type ItemInfo = {
    name: string;
    // 属しているアイテム
    belongingItems: {
        itemId: DataId;
        name: string;
        mapKind: MapKind; // 当該アイテムが存在する地図種別
    }[];
}
/**
 * 指定のIDのアイテム情報を返す
 * @param dataId 
 * @param mapId 
 */
async function getItemInfo(con: PoolConnection, dataId: DataId, mapId: string, contentDefines: ContentFieldDefine[]): Promise<ItemInfo> {
    // 名称取得
    try {
        const name = await async function() {
            const titleDef = contentDefines.find(def => def.type === 'title');
            if (!titleDef) return '';

            const sql = 'select * from contents where data_id = ?';
            const [rows] = await con.query(sql, [dataId]);
            const records = rows as ContentsTable[];
            if (records.length === 0 || !records[0].contents) return '';
            const title = records[0].contents[titleDef.key] as string;
            return title ?? '';    
        }();

        const sql2 = `
        select * from content_belong_map cbm 
        inner join contents c on c.data_id = cbm.item_id 
        where content_id = ? and location_kind <> 'None'
        `;
        const [rows] = await con.query(sql2, [dataId]);
        const records = rows as (ContentBelongMapView & ContentsTable)[];

        return {
            name,
            belongingItems: records.map(rec => {
                const name = getTitleValue(rec.contents ?? {}) ?? '';
                return {
                    itemId: rec.item_id,
                    mapKind: rec.location_kind === DatasourceLocationKindType.VirtualItem ? MapKind.Virtual : MapKind.Real,
                    name,
                }
            }),
        }

    } finally {
    }

}

function getTitleValue(values: ContentValueMap) {
    let result: string | undefined;
    Object.values(values).some(val => {
        if (val.type === 'title') {
            result = val.value;
            return true;
        }
        return false;
    });
    return result;
}