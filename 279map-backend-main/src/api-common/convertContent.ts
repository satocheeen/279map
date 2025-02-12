import { DatasTable } from "../../279map-backend-common/dist";
import { DataSourceTable, ContentsTable, CurrentMap, ImagesTable, MapDataSourceLinkTable, ContentBelongMapView, DataLinkTable } from "../../279map-backend-common/src";
import { BackLink, ContentsDefine, ContentsDetail } from "../graphql/__generated__/types";
import { ContentFieldDefine, ContentValue, ContentValueMap, ContentValueMapInput, DataId, DatasourceLocationKindType, MapKind } from "../types-common/common-types";
import { PoolConnection } from "mysql2/promise";

type Record = ContentsTable & DataSourceTable & MapDataSourceLinkTable;

/**
 * contentsテーブルの値をContentsDefineの形式に変換して返す
 * @param row
 */
export async function convertContentsToContentsDefine(con: PoolConnection, row: Record): Promise<Omit<ContentsDefine, 'linkedContents'>> {
    const id = row.data_id;

    const titleField = function() {
        const contentsDefine = row.contents_define;
        return contentsDefine?.fields.find(fd => fd.type === 'title');
    }();

    // 値があるかどうかチェック
    let hasValue = false;
    const allValues = row.contents ?? {};
    for (const key of row.mdl_config.contentFieldKeyList) {
        const def = row.contents_define?.fields.find(def => def.key === key);
        if (!def) continue;

        const val = allValues[key];
        const hasValueItem = function() {
            if (!val) return false;
            // -- タイトルは値と見做さない
            if (key === titleField?.key) return false;
            if (Array.isArray(val) && (val as []).length === 0) {
                // category項目, image項目またはlink項目で配列0なら、値ありと見做さない
                return false;
            }
            if (typeof val === 'string' && (val as string).length === 0) {
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
        const contentsDefine = row.contents_define;
        return contentsDefine?.fields.filter(fd => fd.type === 'image');
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

/**
 * contentsレコード情報をクライアントに返す形式に変換する
 * @param row レコード情報
 * @param currentMap 
 * @returns 
 */
export async function convertContentsToContentsDetail(con: PoolConnection, row: Record, currentMap: CurrentMap): Promise<ContentsDetail> {
    const id = row.data_id;
    const backlinks = await getBacklinks(con, id, currentMap);
    const usingOtherMap = await checkUsingAnotherMap(con, id, currentMap.mapId);
    const datalinks = await getDataLinks(con, id);

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
            const def = row.contents_define?.fields.find(def => def.key === key);
            if (!def) continue;

            const fixedValue = await async function(): Promise<ContentValue | undefined> {
                const val = allValues[key];
                switch(def.type) {
                    case 'title':
                    case 'string':
                    case 'text':
                    case 'date':
                    case 'url':
                        return {
                            type: def.type,
                            value: typeof val === 'string' ? val : '',
                        }
                    case 'number':
                        return {
                            type: def.type,
                            value: typeof val === 'number' ? val : typeof val === 'string' ? parseInt(val) : 0,
                        }
                    case 'category':
                    case 'single-category':
                        if (Array.isArray(val) && (val as []).every(v => typeof v === 'string')) {
                            return {
                                type: def.type,
                                value: val as string[],
                            }
                        } else {
                            return {
                                type: def.type,
                                value: [],
                            }
                        }
                    // case 'image':
                    //     if (Array.isArray(val)) {
                    //         return {
                    //             type: def.type,
                    //             value: val as DataId[],
                    //         }
                    //     } else {
                    //         return {
                    //             type: def.type,
                    //             value: [],
                    //         }
                    //     }
                    case 'link':
                        const links = datalinks.filter(link => link.from_field_key === def.key);
                        const linkValues = await Promise.all(links.map(async(link) => {
                            const id = link.to_data_id;
                            // 指定のアイテムの名称と使用地図を取得する
                            const itemInfo = await getItemInfo(con, id, currentMap, row.contents_define?.fields ?? []);
                            return {
                                dataId: id,
                                itemInfo,
                            }
                        }));
                        // TODO: ソート定義に応じてソートする
                        const value = linkValues.sort((a, b) => {
                            // とりあえず、更新日時順
                            return (a.itemInfo?.last_edited_time ?? '').localeCompare(b.itemInfo?.last_edited_time ?? '');
                        }).map((val): Extract<ContentValue, {type: 'link'}>['value'][0] => {
                            return {
                                dataId: val.dataId,
                                name: val.itemInfo?.name ?? '',
                            }
                        });

                        return {
                            type: def.type,
                            value,
                        }
                }
            }();
            if (fixedValue)
                result[key] = fixedValue.value;
        }
        return result;
    }();

    // 画像が存在する場合は、valuesにIDを含めて返す
    const imageFields = function() {
        const contentsDefine = row.contents_define;
        return contentsDefine?.fields.filter(fd => fd.type === 'image');
    }() ?? [];
    for (const imageField of imageFields) {
        const ids = await getImageIdList(con, row.data_id, imageField);
        values[imageField.key] = ids;
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
async function getImageIdList(con: PoolConnection, dataId: DataId, imageField: ContentFieldDefine): Promise<number[]> {
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
    values: ContentValueMap;
    last_edited_time: string;
    // 属しているアイテム
    belongingItem?: {
        itemId: DataId;
        name: string;
        mapKind: MapKind; // 当該アイテムが存在する地図種別
    };
}
/**
 * 指定のデータIDが紐づくアイテム情報を返す
 * @param dataId 
 * @param mapId 
 */
async function getItemInfo(con: PoolConnection, dataId: DataId, currentMap: CurrentMap, contentDefines: ContentFieldDefine[]): Promise<ItemInfo | null> {
    // 名称取得
    try {
        const titleDef = contentDefines.find(def => def.type === 'title');
        // if (!titleDef) return '';

        const sql = `
        select * from contents c 
        inner join datas d on c.data_id = d.data_id 
        where c.data_id = ?
        `;
        const [rows] = await con.query(sql, [dataId]);
        const records = rows as (ContentsTable & DatasTable)[];

        if (records.length === 0 || !records[0].contents) return null;

        const title = titleDef ? records[0].contents[titleDef.key] as string : '';

        return {
            name: title,
            last_edited_time: records[0].last_edited_time,
            values: records[0].contents,
        }

    } finally {
    }

}

export function getTitleValue(values: ContentValueMapInput) {
    let result: string | undefined;
    Object.entries(values).some(([key, val]) => {
        if (key === 'title') {
            result = val as string;
            return true;
        }
        return false;
    });
    return result;
}

/**
 * もう片方の地図での、このコンテンツが属するアイテムID一覧を返す
 * @param con 
 * @param contentId 
 */
async function getBacklinks(con: PoolConnection, contentId: DataId, currentMap: CurrentMap) {
    try {
        const sql = currentMap.mapKind === MapKind.Virtual ?
            // 村マップ→日本地図の場合は、位置を持つコンテンツ
            `
            select distinct cbm.item_id, c.contents as item_contents
            from content_belong_map cbm 
            inner join contents c on c.data_id = cbm.item_id 
            where cbm.content_id = cbm.item_id and cbm.content_id = ?
            and map_kind = 'Real'
            `
            :
            // 日本地図→村マップの場合は、VirtualItemに紐づいているもの
            `
            select distinct cbm.item_id, c.contents as item_contents
            from content_belong_map cbm 
            inner join contents c on c.data_id = cbm.item_id 
            where map_kind = 'Virtual' and cbm.content_id = ?
            `;
        const [rows] = await con.query(sql, [contentId]);

        const records = (rows as (ContentBelongMapView & {
            item_contents: ContentValueMapInput | null;
        })[]);

        return records.map((record): BackLink => {
            const itemName = getTitleValue(record.item_contents ?? {}) ?? '';
            return {
                itemId: record.item_id,
                itemName,
            }
        })

    } finally {

    }
}

/**
 * 指定のコンテンツが参照しているリンク情報を返す
 * @param con 
 * @param contentId 
 * @returns 
 */
async function getDataLinks(con: PoolConnection, contentId: DataId) {
    try {
        const sql = 'select * from data_link where from_data_id = ?';
        const [rows] = await con.query(sql, [contentId]);

        const records = rows as DataLinkTable[];
        return records;

    } finally {

    }
}