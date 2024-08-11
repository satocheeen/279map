import { DataSourceTable, ContentsTable, CurrentMap, ImagesTable, MapDataSourceLinkTable, ContentBelongMapView } from "../../279map-backend-common/src";
import { BackLink, ContentsDefine, ContentsDetail } from "../graphql/__generated__/types";
import { ContentFieldDefine, ContentValue, ContentValueMap, ContentValueMapForDB, DataId, DatasourceLocationKindType, MapKind } from "../types-common/common-types";
import { PoolConnection } from "mysql2/promise";

type Record = ContentsTable & DataSourceTable & MapDataSourceLinkTable;

/**
 * contentsテーブルの値をContentsDefineの形式に変換して返す
 * @param row
 */
export async function convertContentsToContentsDefine(con: PoolConnection, row: Record): Promise<Omit<ContentsDefine, 'linkedContents'>> {
    const id = row.data_id;

    const titleField = function() {
        const contentsDefine = row.contents_define as ContentFieldDefine[];
        return contentsDefine.find(fd => fd.type === 'title');
    }();

    // 値があるかどうかチェック
    let hasValue = false;
    const allValues = row.contents ?? {};
    for (const key of row.mdl_config.contentFieldKeyList) {
        const def = row.contents_define?.find(def => def.key === key);
        if (!def) continue;

        const val = allValues[key];
        const hasValueItem = function() {
            if (!val) return false;
            // -- タイトルは値と見做さない
            if (key === titleField?.key) return false;
            if (Array.isArray(val) && val.length === 0) {
                // category項目, image項目またはlink項目で配列0なら、値ありと見做さない
                return false;
            }
            if (typeof val === 'string' && val.length === 0) {
                // テキスト項目で文字数0なら、値ありと見做さない
                return false;
            }
            return true;
        }();
        if (hasValueItem) {
            hasValue = true;
        }
    }

    // 画像が存在する場合は、valuesにIDを含めて返す
    let hasImage = false;
    const imageFields = function() {
        const contentsDefine = row.contents_define as ContentFieldDefine[];
        return contentsDefine.filter(fd => fd.type === 'image');
    }() ?? [];
    for (const imageField of imageFields) {
        const ids = await getImageIdList(con, row.data_id, imageField);
        if (ids.length > 0) hasImage = true;
    }
    return {
        id,
        datasourceId: row.data_source_id,
        hasValue,
        hasImage,
    };
}

export async function convertContentsToContentsDetail(con: PoolConnection, row: Record, currentMap: CurrentMap): Promise<ContentsDetail> {
    const id = row.data_id;
    const backlinks = await getBacklinks(con, id);
    const usingOtherMap = await checkUsingAnotherMap(con, id, currentMap.mapId);

    const readonly = function() {
        if (row.location_kind === DatasourceLocationKindType.VirtualItem) return true;
        return row.config.readonly;
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
                            value: val,
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
        }
        return result;
    }();

    // 画像が存在する場合は、valuesにIDを含めて返す
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
    }
    
    return {
        id,
        datasourceId: row.data_source_id,
        values,
        backlinks,
        usingOtherMap,
        readonly,
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

export function getTitleValue(values: ContentValueMapForDB) {
    let result: string | undefined;
    Object.entries(values).some(([key, val]) => {
        if (key === 'title') {
            result = val;
            return true;
        }
        return false;
    });
    return result;
}

/**
 * 指定のコンテンツを参照元にしているコンテンツ情報の一覧を返す
 * @param con 
 * @param contentId 
 */
async function getBacklinks(con: PoolConnection, contentId: DataId) {
    try {
        const sql = `
        select cbm.*, c.contents as contents, c2.contents as item_contents from data_link dl
        inner join content_belong_map cbm on dl.from_data_id = cbm.content_id 
        inner join contents c on c.data_id = cbm.content_id 
        inner join contents c2 on c2.data_id = cbm.item_id 
        where dl.to_data_id = ? and cbm.item_id <> ? and location_kind <> 'None'
        `;
        const [rows] = await con.query(sql, [contentId, contentId]);

        const records = (rows as (ContentBelongMapView & {
            contents: ContentValueMap;
            item_contents: ContentValueMap;
        })[]);

        return records.map((record): BackLink => {
            const contentName = getTitleValue(record.contents) ?? '';
            const itemName = getTitleValue(record.item_contents) ?? '';
            return {
                contentId: record.content_id,
                contentName,
                itemId: record.item_id,
                itemName,
                mapKind: record.location_kind === DatasourceLocationKindType.VirtualItem ? MapKind.Virtual : MapKind.Real,
            }
        })

    } finally {

    }
}
